import logging
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import APIError, AsyncOpenAI, OpenAIError
from pydantic import BaseModel, Field, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()  # Load environment variables


class Settings(BaseSettings):
    """Application configuration sourced from environment variables or .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openai_api_key: str = Field(..., alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o", alias="OPENAI_MODEL")
    openai_temperature: float = Field(default=0.2, alias="OPENAI_TEMPERATURE")
    openai_max_tokens: int = Field(default=600, alias="OPENAI_MAX_TOKENS")
    max_question_length: int = Field(default=280, alias="MAX_QUESTION_LENGTH")
    max_history_messages: int = Field(default=6, alias="MAX_HISTORY_MESSAGES")
    ai_system_prompt: str = Field(
        default=(
            "You are Fast Facts MD, a supportive study assistant for medical and nursing students. "
            "Provide concise, evidence-based explanations, include clinical pearls when helpful, "
            "and encourage critical thinking. Remind users that your guidance is for educational "
            "purposes and does not replace professional medical advice."
        ),
        alias="AI_SYSTEM_PROMPT",
    )
    cors_allow_origins: list[str] = Field(default_factory=lambda: ["*"], alias="CORS_ALLOW_ORIGINS")

    @field_validator("cors_allow_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("openai_temperature")
    @classmethod
    def validate_temperature(cls, value: float) -> float:
        if not 0 <= value <= 2:
            raise ValueError("OPENAI_TEMPERATURE must be between 0 and 2")
        return value


try:
    settings = Settings()
except ValidationError as exc:  # pragma: no cover - configuration errors should surface immediately
    raise RuntimeError("Invalid configuration detected. Please review environment variables.") from exc

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("fast_facts_md")

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

app = FastAPI(
    title="Fast Facts MD API",
    description="AI-powered study assistant for medical and nursing learners.",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., max_length=settings.max_question_length, min_length=1)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Conversation messages cannot be empty")
        return value.strip()


class QuestionRequest(BaseModel):
    question: str = Field(..., max_length=settings.max_question_length, min_length=1)
    conversation: list[ConversationMessage] = Field(default_factory=list)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Question cannot be empty")
        return value.strip()

    @field_validator("conversation")
    @classmethod
    def trim_conversation(cls, value: list[ConversationMessage]) -> list[ConversationMessage]:
        if len(value) > settings.max_history_messages:
            return value[-settings.max_history_messages :]
        return value


class AnswerResponse(BaseModel):
    response: str


def build_chat_messages(payload: QuestionRequest) -> list[dict[str, str]]:
    chat_messages: list[dict[str, str]] = [
        {"role": "system", "content": settings.ai_system_prompt},
        *[message.model_dump() for message in payload.conversation],
        {"role": "user", "content": payload.question},
    ]
    return chat_messages


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ask", response_model=AnswerResponse, tags=["Chat"])
async def ask_ai(data: QuestionRequest):
    messages = build_chat_messages(data)

    try:
        completion = await openai_client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            temperature=settings.openai_temperature,
            max_tokens=settings.openai_max_tokens,
        )

        message = completion.choices[0].message.content if completion.choices else None
        if not message or not message.strip():
            logger.warning("Received empty completion from OpenAI for question: %s", data.question)
            raise HTTPException(status_code=502, detail="AI service returned an empty response")

        return AnswerResponse(response=message.strip())
    except (APIError, OpenAIError) as exc:
        logger.exception("OpenAI API error")
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable") from exc
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error handling /ask request")
        raise HTTPException(status_code=500, detail="Unexpected server error") from exc

