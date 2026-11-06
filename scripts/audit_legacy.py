#!/usr/bin/env python3
"""Catalogue legacy findings without blocking unrelated changes."""
from pathlib import Path
from engineering_quality.legacy import audit

if __name__ == '__main__':
    findings = audit(Path(__file__).resolve().parent.parent)
    print(f'Legacy backlog updated: {sum(e["status"] == "open" for e in findings)} open findings.')
