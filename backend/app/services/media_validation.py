import subprocess
import json
import tempfile
import os

MAX_VIDEO_DURATION_SECONDS = 60
MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024  # 50MB
MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024  # 10MB, reasonable cap for a photo


class MediaValidationError(Exception):
    pass


def validate_photo_size(photo_bytes: bytes):
    if len(photo_bytes) > MAX_PHOTO_SIZE_BYTES:
        raise MediaValidationError(
            f"Photo exceeds max size of {MAX_PHOTO_SIZE_BYTES // (1024*1024)}MB"
        )


def validate_video(video_bytes: bytes):
    if len(video_bytes) > MAX_VIDEO_SIZE_BYTES:
        raise MediaValidationError(
            f"Video exceeds max size of {MAX_VIDEO_SIZE_BYTES // (1024*1024)}MB"
        )

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "json", tmp_path,
            ],
            capture_output=True, text=True, check=True,
        )
        data = json.loads(result.stdout)
        duration = float(data["format"]["duration"])
    except (subprocess.CalledProcessError, KeyError, ValueError, json.JSONDecodeError) as e:
        raise MediaValidationError(f"Could not read video metadata: {e}")
    finally:
        os.remove(tmp_path)

    if duration > MAX_VIDEO_DURATION_SECONDS:
        raise MediaValidationError(
            f"Video exceeds max duration of {MAX_VIDEO_DURATION_SECONDS} seconds "
            f"(got {duration:.1f}s)"
        )