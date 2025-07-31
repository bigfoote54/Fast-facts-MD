import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)

class TestAskEndpoint:
    def test_ask_happy_path(self):
        """Test successful question processing"""
        mock_response = {
            "choices": [
                {
                    "message": {
                        "content": "This is a test response from the AI assistant."
                    }
                }
            ]
        }
        
        with patch('main.openai.ChatCompletion.create', return_value=mock_response):
            response = client.post(
                "/ask",
                json={"question": "What is hypertension?"}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert data["response"] == "This is a test response from the AI assistant."
    
    def test_ask_empty_question_validation(self):
        """Test validation failure for empty question"""
        response = client.post(
            "/ask",
            json={"question": ""}
        )
        
        assert response.status_code == 422
        
    def test_ask_question_too_long_validation(self):
        """Test validation failure for question longer than 280 characters"""
        long_question = "a" * 281  # 281 characters
        
        response = client.post(
            "/ask",
            json={"question": long_question}
        )
        
        assert response.status_code == 422
        
    def test_ask_whitespace_only_question(self):
        """Test validation failure for whitespace-only question"""
        response = client.post(
            "/ask",
            json={"question": "   "}
        )
        
        assert response.status_code == 422
        
    def test_ask_exactly_280_characters(self):
        """Test that exactly 280 characters is accepted"""
        question_280_chars = "a" * 280
        mock_response = {
            "choices": [
                {
                    "message": {
                        "content": "Response to 280 character question."
                    }
                }
            ]
        }
        
        with patch('main.openai.ChatCompletion.create', return_value=mock_response):
            response = client.post(
                "/ask",
                json={"question": question_280_chars}
            )
        
        assert response.status_code == 200
        
    def test_ask_missing_question_field(self):
        """Test validation failure for missing question field"""
        response = client.post(
            "/ask",
            json={}
        )
        
        assert response.status_code == 422
        
    def test_ask_ai_service_error(self):
        """Test handling of AI service errors"""
        with patch('main.openai.ChatCompletion.create', side_effect=Exception("API Error")):
            response = client.post(
                "/ask",
                json={"question": "What is diabetes?"}
            )
        
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "AI service error" in data["detail"]