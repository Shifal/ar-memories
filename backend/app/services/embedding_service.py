from google import genai
from google.genai import types

from app.config import settings

client = genai.Client(api_key=settings.gemini_api_key)

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768


class EmbeddingError(Exception):
    pass


def generate_embedding(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list[float]:
    """
    task_type: "RETRIEVAL_DOCUMENT" when storing a memory's caption,
               "RETRIEVAL_QUERY" when embedding a user's question later (Step 7).
    """
    try:
        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=EMBEDDING_DIM,
            ),
        )
        return response.embeddings[0].values
    except Exception as e:
        raise EmbeddingError(f"Gemini embedding failed: {e}")