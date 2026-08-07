import subprocess
import tempfile
import os
from PIL import Image

from app.config import settings

MIND_COMPILER_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "mind-compiler")
)

MAX_DIMENSION = 1024


class MindFileGenerationError(Exception):
    pass


def _downscale_if_needed(input_path: str) -> str:
    with Image.open(input_path) as img:
        width, height = img.size
        if max(width, height) <= MAX_DIMENSION:
            return input_path

        scale = MAX_DIMENSION / max(width, height)
        new_size = (int(width * scale), int(height * scale))
        resized = img.convert("RGB").resize(new_size, Image.LANCZOS)
        resized.save(input_path, "JPEG", quality=90)
        return input_path


def generate_mind_file(photo_bytes: bytes) -> bytes:
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as photo_tmp:
        photo_tmp.write(photo_bytes)
        photo_path = photo_tmp.name

    mind_output_path = photo_path + ".mind"

    try:
        _downscale_if_needed(photo_path)

        result = subprocess.run(
            [settings.node_executable_path, "compile.js", photo_path, mind_output_path],
            cwd=MIND_COMPILER_DIR,
            capture_output=True,
            text=True,
            timeout=240,
        )

        if result.returncode != 0 or not os.path.exists(mind_output_path):
            raise MindFileGenerationError(
                f"mind-compiler failed: {result.stderr or result.stdout}"
            )

        with open(mind_output_path, "rb") as f:
            return f.read()

    except subprocess.TimeoutExpired:
        raise MindFileGenerationError("mind-compiler timed out after 120 seconds")
    except Exception as e:
        if isinstance(e, MindFileGenerationError):
            raise
        raise MindFileGenerationError(f"Unexpected error during mind file generation: {e}")

    finally:
        if os.path.exists(photo_path):
            os.remove(photo_path)
        if os.path.exists(mind_output_path):
            os.remove(mind_output_path)