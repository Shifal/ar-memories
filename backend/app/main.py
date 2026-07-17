from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, memories, query
from app.config import settings

app = FastAPI(title="AR Memories API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(memories.router)
app.include_router(query.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}