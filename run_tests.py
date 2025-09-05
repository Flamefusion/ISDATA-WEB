#!/usr/bin/env python3
"""
Test runner script for the rings application.
Provides different test execution options and configurations.
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path

def run_command(command, description):
    """Run a command and handle its output."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {command}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, 
                              capture_output=False, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}")
        return False

def install_test_dependencies():
    """Install test dependencies."""
    return run_command(
        "pip install -r requirements-test.txt",
        "Installing test dependencies"
    )

def run_unit_tests():
    """Run unit tests only."""
    return run_command(
        "pytest tests/unit/ -v --tb=short",
        "Running unit tests"
    )

def run_integration_tests():
    """Run integration tests only."""
    return run_command(
        "pytest tests/integration/ -v --tb=short",
        "Running integration tests"
    )

def run_e2e_tests():
    """Run end-to-end tests."""
    return run_command(
        "pytest tests/e2e/ -v --tb=short -m 'not slow'",
        "Running end-to-end tests"
    )

def run_all_tests():
    """Run all tests with coverage."""
    return run_command(
        "pytest tests/ -v --cov=app --cov-report=html --cov-report=term",
        "Running all tests with coverage"
    )

def run_fast_tests():
    """Run fast tests only (excludes slow tests)."""
    return run_command(
        "pytest tests/ -v -m 'not slow' --tb=short",
        "Running fast tests only"
    )

def run_slow_tests():
    """Run slow tests only."""
    return run_command(
        "pytest tests/ -v -m 'slow' --tb=short",
        "Running slow tests only"
    )

def run_specific_test(test_path):
    """Run a specific test file or test function."""
    return run_command(
        f"pytest {test_path} -v --tb=short",
        f"Running specific test: {test_path}"
    )

def run_tests_with_debug():
    """Run tests with debug output."""
    return run_command(
        "pytest tests/ -v -s --tb=long --log-cli-level=DEBUG",
        "Running tests with debug output"
    )

def check_code_quality():
    """Run code quality checks."""
    commands = [
        ("flake8 app/ --max-line-length=120", "Running flake8 linting"),
        ("black --check app/", "Checking code formatting with black"),
        ("isort --check-only app/", "Checking import sorting with isort"),
    ]
    
    all_passed = True
    for command, description in commands:
        if not run_command(command, description):
            all_passed = False
    
    return all_passed

def generate_test_report():
    """Generate comprehensive test report."""
    return run_command(
        "pytest tests/ --cov=app --cov-report=html --cov-report=xml --junitxml=test-results.xml",
        "Generating comprehensive test report"
    )

def main():
    parser = argparse.ArgumentParser(description="Test runner for rings application")
    parser.add_argument("--install-deps", action="store_true", 
                       help="Install test dependencies")
    parser.add_argument("--unit", action="store_true", 
                       help="Run unit tests only")
    parser.add_argument("--integration", action="store_true", 
                       help="Run integration tests only")
    parser.add_argument("--e2e", action="store_true", 
                       help="Run end-to-end tests")
    parser.add_argument("--all", action="store_true", 
                       help="Run all tests with coverage")
    parser.add_argument("--fast", action="store_true", 
                       help="Run fast tests only")
    parser.add_argument("--slow", action="store_true", 
                       help="Run slow tests only")
    parser.add_argument("--debug", action="store_true", 
                       help="Run tests with debug output")
    parser.add_argument("--quality", action="store_true", 
                       help="Run code quality checks")
    parser.add_argument("--report", action="store_true", 
                       help="Generate comprehensive test report")
    parser.add_argument("--test", type=str, 
                       help="Run specific test file or function")
    parser.add_argument("--ci", action="store_true", 
                       help="Run in CI mode (install deps, run all tests, generate report)")
    
    args = parser.parse_args()
    
    # Set up environment
    os.environ['TESTING'] = 'true'
    
    success = True
    
    if args.ci:
        # CI mode: comprehensive testing
        print("🚀 Running in CI mode...")
        steps = [
            (install_test_dependencies, "Installing dependencies"),
            (check_code_quality, "Code quality checks"),
            (run_all_tests, "Running all tests"),
            (generate_test_report, "Generating reports")
        ]
        
        for step_func, step_name in steps:
            print(f"\n📋 {step_name}...")
            if not step_func():
                print(f"❌ CI failed at: {step_name}")
                success = False
                break
        
        if success:
            print("\n🎉 CI pipeline completed successfully!")
        
    else:
        # Individual commands
        if args.install_deps:
            success &= install_test_dependencies()
        
        if args.quality:
            success &= check_code_quality()
        
        if args.unit:
            success &= run_unit_tests()
        
        if args.integration:
            success &= run_integration_tests()
        
        if args.e2e:
            success &= run_e2e_tests()
        
        if args.all:
            success &= run_all_tests()
        
        if args.fast:
            success &= run_fast_tests()
        
        if args.slow:
            success &= run_slow_tests()
        
        if args.debug:
            success &= run_tests_with_debug()
        
        if args.report:
            success &= generate_test_report()
        
        if args.test:
            success &= run_specific_test(args.test)
        
        # If no specific command, show help and run fast tests
        if not any(vars(args).values()):
            parser.print_help()
            print("\n🔄 No specific command provided. Running fast tests...")
            success &= run_fast_tests()
    
    # Print final status
    if success:
        print("\n✅ All operations completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some operations failed. Check the output above.")
        sys.exit(1)

if __name__ == "__main__":
    main()