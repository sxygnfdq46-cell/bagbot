.PHONY: help test test-cov test-fast lint format clean install setup pre-commit docs build up down logs ps deploy-prod

help:
	@echo "BAGBOT Development Commands"
	@echo "==========================="
	@echo "make install       - Install all dependencies"
	@echo "make setup         - Setup development environment with pre-commit hooks"
	@echo "make test          - Run all tests"
	@echo "make test-fast     - Run tests without integration tests"
	@echo "make test-cov      - Run tests with coverage report"
	@echo "make lint          - Run linting checks"
	@echo "make format        - Format code with black and isort"
	@echo "make pre-commit    - Run pre-commit hooks on all files"
	@echo "make docs          - Validate documentation"
	@echo "make clean         - Remove cache and temporary files"
	@echo "make build         - Build Docker containers"
	@echo "make up            - Start Docker containers"
	@echo "make down          - Stop Docker containers"
	@echo "make logs          - View Docker logs"
	@echo "make ps            - List Docker containers"
	@echo "make deploy-prod   - Deploy to production VPS"

install:
	pip install -r requirements.txt
	pip install pytest pytest-cov black isort flake8 pre-commit

setup: install
	pre-commit install
	@echo "Development environment setup complete!"

test:
	PYTHONPATH=$(shell pwd) pytest -v

test-fast:
	PYTHONPATH=$(shell pwd) pytest -v -k "not integration"

test-cov:
	PYTHONPATH=$(shell pwd) pytest --cov=bagbot --cov-report=html --cov-report=term -v
	@echo "Coverage report generated in htmlcov/index.html"

lint:
	flake8 bagbot --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 bagbot --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
	black --check bagbot
	isort --check-only bagbot

format:
	black bagbot
	isort bagbot
	@echo "Code formatted successfully!"

pre-commit:
	pre-commit run --all-files

docs:
	PYTHONPATH=$(shell pwd) pytest bagbot/tests/test_documentation.py -v
	@echo "Documentation validated!"

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true

# Docker commands
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

ps:
	docker-compose ps
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete
	find . -type f -name "coverage.xml" -delete
	@echo "Cleaned up cache and temporary files!"

# Production deployment
deploy-prod:
	@echo "🚀 Deploying to production..."
	@if [ -z "$(VPS_HOST)" ]; then \
		echo "❌ Error: VPS_HOST not set. Usage: make deploy-prod VPS_HOST=user@host"; \
		exit 1; \
	fi
	@echo "📦 Syncing files to VPS..."
	rsync -avz --exclude='.git' --exclude='node_modules' --exclude='.venv' \
		--exclude='__pycache__' --exclude='.next' \
		./ $(VPS_HOST):/srv/bagbot/
	@echo "🔄 Running deployment script on VPS..."
	ssh $(VPS_HOST) 'cd /srv/bagbot && bash deploy/deploy.sh'
	@echo "✅ Deployment complete!"
