.PHONY: bootstrap install lint type-check test dev build clean help

# Default goal
.DEFAULT_GOAL := help

## Bootstrap the project - install dependencies and setup Playwright
bootstrap:
	@echo "🚀 Bootstrapping Fast Facts MD..."
	@command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm not found. Please install it: https://pnpm.io/installation"; exit 1; }
	pnpm install --frozen-lockfile
	cd frontend && npx playwright install webkit
	@echo "🎉 Ready to go! Use 'make dev' to start development."

## Install dependencies
install:
	pnpm install --frozen-lockfile

## Run linting
lint:
	pnpm run lint

## Run type checking
type-check:
	pnpm run type-check

## Run tests
test:
	cd frontend && npx playwright test

## Start development server
dev:
	cd frontend && pnpm start

## Build for production
build:
	cd frontend && pnpm run export

## Clean dependencies and build artifacts
clean:
	rm -rf node_modules frontend/node_modules backend/__pycache__
	rm -rf frontend/.expo frontend/dist frontend/build
	rm -rf playwright-report test-results

## Show help
help:
	@echo "Fast Facts MD - Available commands:"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\033[36m\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)