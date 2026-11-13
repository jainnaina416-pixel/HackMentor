#!/usr/bin/env python3
"""
CLI script to ingest historical hackathon projects dataset into ChromaDB.
Usage:
  python backend/scripts/ingest_dataset.py
  python backend/scripts/ingest_dataset.py --file path/to/my_dataset.json
"""
import sys
import argparse
from pathlib import Path

# Configure utf-8 output if possible
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure root directory is on Python path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.rag.ingest import ingest_historical_dataset

def main():
    parser = argparse.ArgumentParser(description="Ingest historical hackathon projects into HackMentor RAG Vector Store.")
    parser.add_argument(
        "--file",
        type=str,
        default=str(settings.DATA_DIR / "sample_projects.json"),
        help="Path to JSON or CSV dataset file."
    )
    parser.add_argument(
        "--collection",
        type=str,
        default="devpost_historical_projects",
        help="Target ChromaDB collection name."
    )
    args = parser.parse_args()

    print(f"\n[*] Starting HackMentor RAG Ingestion...")
    print(f"[*] Dataset: {args.file}")
    print(f"[*] Target Collection: {args.collection}\n")

    try:
        stats = ingest_historical_dataset(dataset_path=args.file, collection_name=args.collection)
        print("\n[OK] Ingestion Succeeded!")
        for k, v in stats.items():
            print(f"  * {k}: {v}")
    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        print(f"\n[FAIL] Ingestion Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
