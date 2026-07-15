from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app import models, schemas
from app.services.storage_service import upload_file
from app.services.media_validation import (
    validate_photo_size,
    validate_video,
    MediaValidationError,
)

router = APIRouter(prefix="/memories", tags=["memories"])


@router.post("/", response_model=schemas.MemoryOut, status_code=201)
async def create_memory(
    photo: UploadFile = File(...),
    video: UploadFile = File(...),
    caption: str = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    photo_bytes = await photo.read()
    video_bytes = await video.read()

    try:
        validate_photo_size(photo_bytes)
        validate_video(video_bytes)
    except MediaValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    photo_url = upload_file("photos", photo_bytes, photo.filename, photo.content_type)
    video_url = upload_file("videos", video_bytes, video.filename, video.content_type)

    memory = models.Memory(
        user_id=current_user.id,
        photo_url=photo_url,
        video_url=video_url,
        caption=caption,
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return memory


@router.get("/", response_model=list[schemas.MemoryOut])
def list_memories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Memory).filter(models.Memory.user_id == current_user.id).all()