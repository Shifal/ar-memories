import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app import models, schemas
from app.services.generation_service import generate_answer, GenerationError
from app.services.groundedness_service import check_groundedness, GroundednessError

router = APIRouter(prefix="/memories", tags=["query"])


@router.post("/{memory_id}/ask", response_model=schemas.AskResponse)
def ask_about_memory(
    memory_id: uuid.UUID,
    request: schemas.AskRequest,
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

    if not memory.caption:
        return schemas.AskResponse(
            question=request.question,
            answer="I don't have enough information stored about this memory to answer that.",
            was_grounded=False,
        )

    try:
        answer = generate_answer(memory.caption, request.question)
    except GenerationError as e:
        raise HTTPException(status_code=502, detail=str(e))

    try:
        grounded = check_groundedness(memory.caption, request.question, answer)
    except GroundednessError:
        grounded = False

    log = models.QueryLog(
        memory_id=memory.id,
        question=request.question,
        answer=answer,
        was_grounded=str(grounded),
    )
    db.add(log)
    db.commit()

    return schemas.AskResponse(question=request.question, answer=answer, was_grounded=grounded)