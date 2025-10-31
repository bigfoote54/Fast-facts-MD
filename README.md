# Fast Facts MD

Fast Facts MD is an AI-powered study companion that helps medical and nursing learners review complex topics with concise explanations, mnemonics, and clinical pearls. The project ships with a production-ready FastAPI backend, an Expo/React Native client, and shared type definitions for end-to-end type safety.

## Project Structure

```
fast-facts-md/
├── backend/          # FastAPI service for OpenAI-powered responses
├── frontend/         # Expo app with chat UI
├── shared/           # Shared TypeScript contracts
└── tests/            # End-to-end Playwright scenarios
```

## Requirements

- Node.js 20+
- npm 10+
- Python 3.12+
- OpenAI API key with access to the configured model (default `gpt-4o`)

## 1. Configure Environment

### Backend (`backend/.env`)

Copy the example file and update the required values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ | — | Secret key used to authenticate with OpenAI |
| `OPENAI_MODEL` | ❌ | `gpt-4o` | Chat model used for completions |
| `OPENAI_TEMPERATURE` | ❌ | `0.2` | Controls creativity in responses |
| `OPENAI_MAX_TOKENS` | ❌ | `600` | Maximum tokens returned per answer |
| `MAX_QUESTION_LENGTH` | ❌ | `280` | Request validation limit in characters |
| `MAX_HISTORY_MESSAGES` | ❌ | `6` | Number of prior exchanges forwarded to OpenAI |
| `AI_SYSTEM_PROMPT` | ❌ | preconfigured | System instructions for the assistant tone |
| `CORS_ALLOW_ORIGINS` | ❌ | `*` | Comma-separated list of allowed origins |

### Frontend (`frontend/.env`)

Expo reads configuration from `app.config` or `EXPO_PUBLIC_*` variables. Create a `.env` file in the frontend directory if you need to override defaults:

```
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
EXPO_PUBLIC_MAX_QUESTION_LENGTH=280
EXPO_PUBLIC_MAX_HISTORY_MESSAGES=6
```

## 2. Install Dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

## 3. Run the App

```bash
# Terminal 1 – start the API
cd backend
uvicorn main:app --reload

# Terminal 2 – start the Expo app
cd frontend
npx expo start
```

Expo will print QR codes and simulator options; the API is available at `http://127.0.0.1:8000` with OpenAPI docs at `/docs`.

## 4. Quality Gates

```bash
# Backend unit tests
cd backend
python3 -m pytest

# Frontend type checks
cd frontend
npm run type-check
```

Playwright end-to-end scenarios live in `tests/` and can be executed with `npx playwright test` once the app is running.

## Key Features

- ✅ Async OpenAI integration with configurable system prompts and conversation history
- ✅ Strong validation via Pydantic (v2) and consolidated settings management
- ✅ Shared TypeScript contracts to keep the mobile client and API in sync
- ✅ Conversation-aware chat UI with loading states, sample prompts, and character limits
- ✅ Comprehensive pytest suite covering API success, validation, and error flows

## Deployment Notes

- Always provide a valid `OPENAI_API_KEY` at deploy time; the API will fail fast on startup if it is missing or invalid.
- Configure `CORS_ALLOW_ORIGINS` to the production domain serving your Expo app or web build.
- For Expo web or native builds, make sure `EXPO_PUBLIC_API_BASE_URL` points to your deployed API (e.g., `https://api.fastfactsmd.com`).
- Enable HTTPS and configure secret storage (e.g., GitHub Actions, Vercel, Render) for all API keys before releasing to users.

---

Questions or feedback? Open an issue and tag it with `enhancement` or `bug` so we can continue improving Fast Facts MD together.
