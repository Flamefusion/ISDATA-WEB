# Makefile for rings application testing
.PHONY: help install test test-unit test-integration test-e2e test-all test-fast test-slow test-debug coverage clean lint format check ci

# Default target
help:
	@echo "Available targets:"
	@echo "  install        Install test dependencies"
	@echo "  test           Run fast tests (default)"
	@echo "  test-unit      Run unit tests only"
	@echo "  test-integration Run integration tests only"
	@echo "  test-e2e       Run end-to-end tests"
	@echo "  test-all       Run all tests with coverage"
	@echo "  test-fast      Run fast tests only"
	@echo "  test-slow      Run slow tests only"
	@echo "  test-debug     Run tests with debug output"
	@echo "  coverage       Generate coverage report"
	@echo "  lint           Run code linting"
	@echo "  format         Format code with black and isort"
	@echo "  check          Run all code quality checks"
	@echo "  ci             Run CI pipeline locally"
	@echo "  clean          Clean up test artifacts"

# Install dependencies
install:
	pip install -r requirements-test.txt
	pip install -e .

# Test targets
test: test-fast

test-unit:
	PYTHONPATH=. pytest tests/unit/ -v --tb=short

test-integration:
	PYTHONPATH=. pytest tests/integration/ -v --tb=short

test-e2e:
	PYTHONPATH=. pytest tests/e2e/ -v --tb=short -m "not slow"

test-all:
	PYTHONPATH=. pytest tests/ -v --cov=app --cov-report=html --cov-report=term

test-fast:
	PYTHONPATH=. pytest tests/ -v -m "not slow" --tb=short

test-slow:
	PYTHONPATH=. pytest tests/ -v -m "slow" --tb=short

test-debug:
	PYTHONPATH=. pytest tests/ -v -s --tb=long --log-cli-level=DEBUG

# Coverage
coverage:
	PYTHONPATH=. pytest tests/ --cov=app --cov-report=html --cov-report=term --cov-report=xml

# Code quality
lint:
	flake8 app/ --max-line-length=120
	black --check app/
	isort --check-only app/

format:
	black app/
	isort app/

check: lint
	@echo "All code quality checks passed!"

# CI pipeline
ci:
	@echo "Running CI pipeline locally..."
	make install
	make check
	make test-all
	@echo "CI pipeline completed successfully!"

# Cleanup
clean:
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf coverage.xml
	rm -rf test-results.xml
	rm -rf .pytest_cache/
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

# Development shortcuts
dev-setup: install
	@echo "Development environment setup complete!"

test-watch:
	@echo "Running tests in watch mode..."
	PYTHONPATH=. pytest tests/ -f --tb=short

# Specific test runners
test-data:
	PYTHONPATH=. pytest tests/unit/test_data_handler.py -v

test-db:
	PYTHONPATH=. pytest tests/unit/test_database.py tests/integration/test_db_routes.py -v

test-api:
	PYTHONPATH=. pytest tests/integration/ -v

test-reports:
	PYTHONPATH=. pytest tests/integration/test_report_routes.py -v

# Performance testing
test-performance:
	PYTHONPATH=. pytest tests/ -v -m "slow" --tb=short

# Test with different markers
test-database-required:
	PYTHONPATH=. pytest tests/ -v -m "database" --tb=short

test-sheets-required:
	PYTHONPATH=. pytest tests/ -v -m "sheets" --tb=short

# Generate test data
generate-test-data:
	PYTHONPATH=. python -c "from tests.factories import create_test_dataset; import json; data = create_test_dataset(); print(json.dumps(data[:10], indent=2, default=str))"