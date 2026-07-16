from google import genai

from app.config import settings

client = genai.Client(api_key=settings.gemini_api_key)


class GroundednessError(Exception):
    pass


def check_groundedness(caption: str, question: str, answer: str) -> bool:
    prompt = (
        "You are a fact-checker. Given a source description, a question, and an answer, "
        "determine if the answer is fully supported by the source description alone "
        "(no outside knowledge, no assumptions).\n\n"
        f"Source description: {caption}\n\n"
        f"Question: {question}\n\n"
        f"Answer: {answer}\n\n"
        "Reply with exactly one word: YES or NO."
    )
    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
        )
        result = response.text.strip().upper()
        return result.startswith("YES")
    except Exception as e:
        raise GroundednessError(f"Groundedness check failed: {e}")