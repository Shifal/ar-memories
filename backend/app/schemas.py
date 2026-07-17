import uuid
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    name: str | None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MemoryOut(BaseModel):
    id: uuid.UUID
    photo_url: str
    video_url: str
    caption: str | None
    mind_file_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    question: str
    answer: str
    was_grounded: bool

class UserUpdate(BaseModel):
    name: str | None = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str