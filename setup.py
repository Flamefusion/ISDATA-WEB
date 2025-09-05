#!/usr/bin/env python3
"""
Setup script for the rings application.
This helps with test imports and development setup.
"""
from setuptools import setup, find_packages

setup(
    name="rings-app",
    version="1.0.0",
    description="Rings manufacturing data management application",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "flask",
        "flask-cors",
        "psycopg2-binary",
        "pandas",
        "gspread",
        "google-auth",
        "python-dotenv",
        "openpyxl"
    ],
    extras_require={
        "test": [
            "pytest>=7.4.3",
            "pytest-flask>=1.3.0",
            "pytest-mock>=3.12.0",
            "pytest-cov>=4.1.0",
            "pytest-env>=1.1.3",
            "pytest-postgresql>=5.0.0",
            "responses>=0.24.1",
            "pytest-asyncio>=0.21.1",
            "factory-boy>=3.3.0",
            "faker>=20.1.0"
        ]
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)