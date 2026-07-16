from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, memories, query

app = FastAPI(title="AR Memories API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(memories.router)
app.include_router(query.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}