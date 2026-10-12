#!/usr/bin/env python3
"""Compatibility entrypoint: source violations now fail automatically."""
from engineering_quality.cli import main

if __name__ == '__main__':
    raise SystemExit(main(size_only=True))
