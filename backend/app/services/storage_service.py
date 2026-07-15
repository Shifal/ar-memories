import uuid
from supabase import create_client, Client

from app.config import settings

supabase: Client = create_client(settings.supabase_url, settings.supabase_service_key)


def upload_file(bucket: str, file_bytes: bytes, filename: str, content_type: str) -> str:
    """Uploads a file to a Supabase Storage bucket and returns its public URL."""
    ext = filename.split(".")[-1] if "." in filename else "bin"
    unique_name = f"{uuid.uuid4()}.{ext}"

    supabase.storage.from_(bucket).upload(
        path=unique_name,
        file=file_bytes,
        file_options={"content-type": content_type},
    )

    return supabase.storage.from_(bucket).get_public_url(unique_name)