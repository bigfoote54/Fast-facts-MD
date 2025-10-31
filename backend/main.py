import logging
import os
from typing import Final

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import APIError, AsyncOpenAI, OpenAIError
from pydantic import BaseModel, Field, field_validator

load_dotenv()  # Load environment variables

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL: Final[str] = os.getenv("OPENAI_MODEL", "gpt-4o")
OPENAI_TEMPERATURE: Final[float] = float(os.getenv("OPENAI_TEMPERATURE", "0.2"))
OPENAI_MAX_TOKENS: Final[int] = int(os.getenv("OPENAI_MAX_TOKENS", "600"))

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable must be set before starting the API server.")

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str = Field(..., max_length=280, min_length=1)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Question cannot be empty")
        return value.strip()

class AnswerResponse(BaseModel):
    response: str

@app.post("/ask", response_model=AnswerResponse)
async def ask_ai(data: QuestionRequest):
    try:
        completion = await openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": data.question}],
            temperature=OPENAI_TEMPERATURE,
            max_tokens=OPENAI_MAX_TOKENS,
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

