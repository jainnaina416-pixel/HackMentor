import os
import json
import re
from typing import Optional, Any
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.config import settings
from app.core.logging import logger

class LLMConfigurationError(Exception):
    pass

def get_llm(temperature: Optional[float] = None, streaming: bool = False) -> BaseChatModel:
    """
    Factory function returning a configured LangChain ChatModel.
    Provider is selected based on settings.LLM_PROVIDER or available API keys.
    """
    temp = temperature if temperature is not None else settings.LLM_TEMPERATURE
    provider = settings.LLM_PROVIDER.lower()

    # 1. Groq (Fast inference, high rate-limit)
    groq_key = settings.GROQ_API_KEY or os.getenv("Groq_API_KEY") or os.getenv("GROQ_API_KEY")
    if (provider == "groq" or not provider) and groq_key:
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(
                groq_api_key=groq_key,
                model_name=settings.LLM_MODEL or "openai/gpt-oss-20b",
                temperature=temp,
                streaming=streaming,
            )
        except Exception as e:
            logger.warning(f"Failed to initialize ChatGroq: {e}. Falling back to next available.")

    # 2. Google Gemini
    google_key = settings.GOOGLE_API_KEY or os.getenv("Google_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if (provider == "google" or not provider) and google_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                google_api_key=google_key,
                model="gemini-1.5-flash",
                temperature=temp,
                streaming=streaming,
            )
        except Exception as e:
            logger.warning(f"Failed to initialize ChatGoogleGenerativeAI: {e}. Falling back.")

    # 3. OpenAI
    openai_key = settings.OPENAI_API_KEY or os.getenv("OpenAI_API_KEY") or os.getenv("OPENAI_API_KEY")
    if (provider == "openai" or not provider) and openai_key:
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                api_key=openai_key,
                model="gpt-4o-mini",
                temperature=temp,
                streaming=streaming,
            )
        except Exception as e:
            logger.warning(f"Failed to initialize ChatOpenAI: {e}.")

    # If no key found for requested provider:
    raise LLMConfigurationError(
        f"No valid LLM API key configured for provider '{provider}'. "
        "Please provide GROQ_API_KEY, GOOGLE_API_KEY, or OPENAI_API_KEY in your .env file."
    )

def parse_json_from_llm(content: str) -> Any:
    """Safely extracts and parses JSON from LLM output, stripping markdown code blocks."""
    cleaned = content.strip()
    
    # Remove markdown code fences
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    # Try standard parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Regex search for first { ... } or [ ... ]
        obj_match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
        if obj_match:
            try:
                return json.loads(obj_match.group(1))
            except Exception:
                pass
        raise ValueError(f"Could not parse valid JSON from LLM response: {cleaned[:200]}...")
