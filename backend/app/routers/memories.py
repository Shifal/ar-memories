from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.deps import get_current_user
from app import models, schemas
from app.services.storage_service import upload_file
from app.services.media_validation import (
    validate_photo_size,
    validate_video,
    MediaValidationError,
)
from app.services.mind_file_service import generate_mind_file, MindFileGenerationError
from app.services.embedding_service import generate_embedding, EmbeddingError

router = APIRouter(prefix="/memories", tags=["memories"])


def process_mind_file_in_background(memory_id, photo_bytes: bytes):
    """Runs after the HTTP response is already sent — no timeout pressure."""
    db = SessionLocal()
    try:
        mind_bytes = generate_mind_file(photo_bytes)
        mind_file_url = upload_file("mind-files", mind_bytes, "target.mind", "application/octet-stream")

        memory = db.query(models.Memory).filter(models.Memory.id == memory_id).first()
        if memory:
            memory.mind_file_url = mind_file_url
            db.commit()
    except MindFileGenerationError as e:
        print(f"Warning: background mind file generation failed: {e}")
    except Exception as e:
        print(f"Warning: unexpected error in background mind file generation: {e}")
    finally:
        db.close()


@router.post("/", response_model=schemas.MemoryOut, status_code=201)
async def create_memory(
    background_tasks: BackgroundTasks,
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
        mind_file_url=None,
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)

    # Kick off .mind generation + embedding AFTER the response is sent — no timeout risk
    background_tasks.add_task(process_mind_file_in_background, memory.id, photo_bytes)

    if caption:
        try:
            vector = generate_embedding(caption, task_type="RETRIEVAL_DOCUMENT")
            embedding_row = models.MemoryEmbedding(memory_id=memory.id, embedding=vector)
            db.add(embedding_row)
            db.commit()
        except EmbeddingError as e:
            print(f"Warning: embedding generation failed: {e}")

    return memory


@router.get("/", response_model=list[schemas.MemoryOut])
def list_memories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Memory).filter(models.Memory.user_id == current_user.id).all()


@router.patch("/{memory_id}", response_model=schemas.MemoryOut)
def update_memory(
    memory_id,
    updates: schemas.MemoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    memory = (
        db.query(models.Memory)
        .filter(models.Memory.id == memory_id, models.Memory.user_id == current_user.id)
        .first()
    )
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    if updates.caption is not None:
        memory.caption = updates.caption

    db.commit()
    db.refresh(memory)
    return memory


@router.delete("/{memory_id}", status_code=204)
def delete_memory(
    memory_id,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    memory = (
        db.query(models.Memory)
        .filter(models.Memory.id == memory_id, models.Memory.user_id == current_user.id)
        .first()
    )
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    db.query(models.MemoryEmbedding).filter(models.MemoryEmbedding.memory_id == memory_id).delete()
    db.query(models.QueryLog).filter(models.QueryLog.memory_id == memory_id).delete()

    db.delete(memory)
    db.commit()
    return None