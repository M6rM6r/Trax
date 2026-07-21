.PHONY: help install dev dev:fast build build:analyze test test:coverage test:e2e lint format type-check docker-up docker-down docker-build docker-logs docker-ps docker-clean ai-install ai-test ai-lint ai-retrain ai-health ai-metrics api-install api-test api-lint api-analyse api-migrate api-seed api-fresh api-swagger api-health api-cache-clear mobile-run mobile-build mobile-test mobile-codegen reverb-start reverb-stop security-audit monitoring-up quality-frontend quality-all

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

test:e2e: ## Run Playwright E2E tests
	npm run test:e2e

lint: ## Lint code
	npm run lint

format: ## Format code
	npm run format

type-check: ## TypeScript type check
	npm run type-check

# === Docker ===
docker-up: ## Start all services via docker-compose
	docker compose up -d

docker-down: ## Stop all services
	docker compose down

docker-build: ## Build all docker images
	docker compose build

docker-logs: ## Tail docker logs
	docker compose logs -f

docker-ps: ## List running containers
	docker compose ps

docker-clean: ## Stop and remove all containers, volumes, networks
	docker compose down -v --remove-orphans

# === AI Service ===
ai-install: ## Install AI service dependencies
	cd services/ai && pip install -r requirements.txt

ai-test: ## Run AI service tests
	cd services/ai && pytest -v

ai-lint: ## Lint AI service code
	cd services/ai && ruff check .

ai-retrain: ## Trigger model retraining from database
	curl -X POST http://localhost:8001/api/ai/models/retrain

ai-health: ## Check AI service health
	curl -s http://localhost:8001/health | python -m json.tool

ai-metrics: ## Check AI Prometheus metrics
	curl -s http://localhost:8001/metrics | head -50

# === API (Laravel) ===
api-install: ## Install API dependencies
	cd services/api && composer install

api-test: ## Run API tests
	cd services/api && vendor/bin/phpunit

api-lint: ## Run Laravel Pint checks
	cd services/api && vendor/bin/pint --test

api-analyse: ## Run PHPStan static analysis
	cd services/api && vendor/bin/phpstan analyse --memory-limit=1G

api-migrate: ## Run database migrations
	cd services/api && php artisan migrate

api-seed: ## Seed database
	cd services/api && php artisan db:seed --class=TraxDatabaseSeeder

api-fresh: ## Fresh migrate + seed
	cd services/api && php artisan migrate:fresh --seed --class=TraxDatabaseSeeder

api-swagger: ## Generate Swagger docs
	cd services/api && php artisan l5-swagger:generate

api-health: ## Check API health
	curl -s http://localhost:8000/api/health | python -m json.tool

api-cache-clear: ## Clear API Redis cache
	cd services/api && php artisan cache:clear

# === WebSocket (Reverb) ===
reverb-start: ## Start Reverb WebSocket server
	cd services/api && php artisan reverb:start --debug

reverb-stop: ## Stop Reverb WebSocket server
	kill $$(lsof -t -i:8080) 2>/dev/null || true

# === Mobile ===
mobile-run: ## Run Flutter app
	cd services/mobile && flutter run

mobile-build: ## Build Flutter APK
	cd services/mobile && flutter build apk --release

mobile-test: ## Run Flutter tests
	cd services/mobile && flutter test

mobile-codegen: ## Generate freezed/json_serializable code
	cd services/mobile && dart run build_runner build --delete-conflicting-outputs

# === Security & Monitoring ===
security-audit: ## Run security audits across all services
	npm audit --audit-level=moderate || true
	cd services/api && composer audit || true
	cd services/ai && pip-audit -r requirements.txt || true
	cd services/ai && bandit -r . -f json -o bandit-report.json || true

monitoring-up: ## Start Prometheus + Grafana monitoring stack
	docker compose up -d prometheus grafana node-exporter

# === Quality Gates ===
quality-frontend: ## Frontend quality gate
	npm run type-check && npm run lint && npm run test -- --passWithNoTests

quality-all: ## Cross-stack quality gate (frontend + api + ai)
	$(MAKE) quality-frontend
	$(MAKE) api-lint
	$(MAKE) api-analyse
	$(MAKE) api-test
	$(MAKE) ai-lint
	$(MAKE) ai-test
