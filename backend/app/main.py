from fastapi import FastAPI

from app.routers import auth, memories, query

app = FastAPI(title="AR Memories API")

app.include_router(auth.router)
app.include_router(memories.router)
app.include_router(query.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}