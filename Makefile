.PHONY: help install dev dev:fast build build:analyze test test:coverage lint format type-check docker-up docker-down docker-build docker-logs ai-install ai-test api-install api-test api-migrate api-seed mobile-run

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# === Frontend ===
install: ## Install frontend dependencies
	npm ci

dev: ## Start dev server
	npm run dev

dev:fast: ## Start dev server with Turbopack
	npm run dev:fast

build: ## Production build
	npm run build

build:analyze: ## Build with bundle analyzer
	npm run build:analyze

test: ## Run tests
	npm run test

test:coverage: ## Run tests with coverage
	npm run test:coverage

lint: ## Lint code
	npm run lint

format: ## Format code
	npm run format

type-check: ## TypeScript type check
	npm run type-check

# === Docker ===
docker-up: ## Start all services via docker-compose
	docker-compose up -d

docker-down: ## Stop all services
	docker-compose down

docker-build: ## Build all docker images
	docker-compose build

docker-logs: ## Tail docker logs
	docker-compose logs -f

# === AI Service ===
ai-install: ## Install AI service dependencies
	cd services/ai && pip install -r requirements.txt

ai-test: ## Run AI service tests
	cd services/ai && pytest -v

# === API (Laravel) ===
api-install: ## Install API dependencies
	cd services/api && composer install

api-test: ## Run API tests
	cd services/api && vendor/bin/phpunit

api-migrate: ## Run database migrations
	cd services/api && php artisan migrate

api-seed: ## Seed database
	cd services/api && php artisan db:seed --class=TraxDatabaseSeeder

# === Mobile ===
mobile-run: ## Run Flutter app
	cd services/mobile && flutter run
