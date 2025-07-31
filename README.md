# Fast Facts MD
> AI Study Assistant for Medical & Nursing Students

A mobile-first AI-powered study tool where students can instantly ask medical and nursing-related questions and receive quick, concise, and accurate explanations based on evidence-based sources.

## 🚀 Quick Start

```bash
# Bootstrap the project (one-time setup)
make bootstrap
# or
npm run setup

# Start development
make dev
```

## 📱 Mobile-First Testing

This project includes comprehensive mobile Safari testing using Playwright:

- **iPhone 14 viewport testing** with WebKit engine
- **Automated CI/CD** on GitHub Actions
- **Screenshot artifacts** on test failures
- **Mobile-responsive chat interface**

### Running Tests Locally

```bash
# Run all tests
make test

# Run with UI (helpful for debugging)
cd frontend && npx playwright test --ui

# Run specific browser
cd frontend && npx playwright test --project="iPhone 14 Safari"
```

## 🔧 Development

```bash
# Install dependencies
make install

# Lint code
make lint

# Type check
make type-check

# Build for production
make build

# Clean everything
make clean
```

## 📖 Mobile GitHub Workflow

### For Mobile Development:

1. **Push from GitHub Mobile**: 
   - Edit files directly in GitHub Mobile app
   - Commit changes with conventional messages (`feat:`, `fix:`, `chore:`)

2. **Watch Tests Run**:
   - Navigate to `Actions` tab in GitHub Mobile
   - Click on the running workflow
   - Monitor real-time progress

3. **View Test Artifacts on iPhone**:
   - Once workflow completes, scroll to "Artifacts" section
   - Download `playwright-report` 
   - Open the HTML report in mobile Safari
   - View screenshots of any failed tests
   - Check mobile responsiveness screenshots

### CI/CD Features:

- ✅ **pnpm workspace** with frozen lockfile
- ✅ **ESLint + Prettier** with Airbnb config
- ✅ **TypeScript strict mode** with incremental compilation
- ✅ **Playwright mobile testing** with WebKit
- ✅ **Automatic PR comments** with test results
- ✅ **Artifact uploads** for screenshots and reports
- ✅ **5-minute CI timeout** for fast feedback

## 🏗️ Architecture

```
fast-facts-md/
├── frontend/          # Expo React Native app
│   ├── app/          # File-based routing
│   ├── components/   # Reusable components
│   └── tests/        # Playwright tests
├── backend/          # Python API (future)
├── .github/          # CI/CD workflows
└── tests/            # Cross-platform tests
```

## 🔧 Tech Stack

- **Frontend**: Expo + React Native + TypeScript
- **Testing**: Playwright (WebKit/Safari)
- **CI/CD**: GitHub Actions + pnpm
- **Linting**: ESLint + Prettier (Airbnb config)
- **Type Safety**: TypeScript 5.7+ (strict mode)

---

*Built for mobile-first development with GitHub Actions CI/CD*
