import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("OPENAI_API_KEY", "test-api-key")

from main import app


client = TestClient(app)


@pytest.fixture()
def mock_chat_create():
    with patch("main.openai_client.chat.completions.create", new_callable=AsyncMock) as mock:
        yield mock


class TestAskEndpoint:
    def test_ask_happy_path(self, mock_chat_create: AsyncMock):
        mock_choice = MagicMock()
        mock_choice.message.content = "This is a test response from the AI assistant."
        mock_chat_create.return_value = MagicMock(choices=[mock_choice])

        response = client.post(
            "/ask",
            json={"question": "What is hypertension?"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["response"] == "This is a test response from the AI assistant."
        mock_chat_create.assert_awaited_once()

    def test_ask_empty_question_validation(self):
        response = client.post(
            "/ask",
            json={"question": ""},
        )

        assert response.status_code == 422

    def test_ask_question_too_long_validation(self):
        long_question = "a" * 281

        response = client.post(
            "/ask",
            json={"question": long_question},
        )

        assert response.status_code == 422

    def test_ask_whitespace_only_question(self):
        response = client.post(
            "/ask",
            json={"question": "   "},
        )

        assert response.status_code == 422

    def test_ask_exactly_280_characters(self, mock_chat_create: AsyncMock):
        question_280_chars = "a" * 280
        mock_choice = MagicMock()
        mock_choice.message.content = "Response to 280 character question."
        mock_chat_create.return_value = MagicMock(choices=[mock_choice])

        response = client.post(
            "/ask",
            json={"question": question_280_chars},
        )

        assert response.status_code == 200
        mock_chat_create.assert_awaited_once()

    def test_ask_missing_question_field(self):
        response = client.post(
            "/ask",
            json={},
        )

        assert response.status_code == 422

    def test_ask_ai_service_error(self, mock_chat_create: AsyncMock):
        mock_chat_create.side_effect = Exception("API Error")

        response = client.post(
            "/ask",
            json={"question": "What is diabetes?"},
        )

        assert response.status_code == 500
        data = response.json()
        assert data["detail"] == "Unexpected server error"

    def test_ask_ai_returns_empty_response(self, mock_chat_create: AsyncMock):
        mock_chat_create.return_value = MagicMock(choices=[])

        response = client.post(
            "/ask",
            json={"question": "Explain insulin."},
        )

        assert response.status_code == 502
        data = response.json()
        assert data["detail"] == "AI service returned an empty response"
