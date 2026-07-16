from google import genai

from app.config import settings

client = genai.Client(api_key=settings.gemini_api_key)


class GenerationError(Exception):
    pass


def generate_answer(caption: str, question: str) -> str:
    prompt = (
        "You are answering a question about a personal memory (a photo + video moment). "
        "Only use the information given below. If the information doesn't answer the question, "
        "say you don't have enough information about this memory to answer that.\n\n"
        f"Memory description: {caption}\n\n"
        f"Question: {question}\n\n"
        "Answer in one or two short sentences."
    )
    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        raise GenerationError(f"Gemini generation failed: {e}")