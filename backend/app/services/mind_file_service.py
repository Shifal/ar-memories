import subprocess
import tempfile
import os

MIND_COMPILER_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "mind-compiler")
)
NODE_EXECUTABLE = r"C:\Users\SYED SHIFAL\AppData\Local\nvm\v20.20.2\node.exe"


class MindFileGenerationError(Exception):
    pass


def generate_mind_file(photo_bytes: bytes) -> bytes:
    """
    Runs the Node.js mind-compiler on a photo and returns the compiled .mind file bytes.
    """
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as photo_tmp:
        photo_tmp.write(photo_bytes)
        photo_path = photo_tmp.name

    mind_output_path = photo_path + ".mind"

    try:
        result = subprocess.run(
            [NODE_EXECUTABLE, "compile.js", photo_path, mind_output_path],
            cwd=MIND_COMPILER_DIR,
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0 or not os.path.exists(mind_output_path):
            raise MindFileGenerationError(
                f"mind-compiler failed: {result.stderr or result.stdout}"
            )

        with open(mind_output_path, "rb") as f:
            return f.read()

    finally:
        if os.path.exists(photo_path):
            os.remove(photo_path)
        if os.path.exists(mind_output_path):
            os.remove(mind_output_path)