from fastapi import FastAPI

from app.routers import auth, memories

app = FastAPI(title="AR Memories API")

app.include_router(auth.router)
app.include_router(memories.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}