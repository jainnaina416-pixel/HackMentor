import json
import csv
from pathlib import Path
from typing import List, Dict, Any, Union

from app.core.config import settings
from app.core.logging import logger
from app.rag.document_processor import document_processor
from app.rag.vector_store import vector_store_manager, COLLECTION_DEVPOST

def load_projects_from_file(file_path: Union[str, Path]) -> List[Dict[str, Any]]:
    """Loads raw project data from either JSON or CSV file."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found at: {path}")

    logger.info(f"Loading hackathon projects dataset from: {path}")
    projects: List[Dict[str, Any]] = []

    if path.suffix.lower() == ".json":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                projects = data
            elif isinstance(data, dict):
                # Handle cases where data is nested e.g. {"projects": [...]}
                for val in data.values():
                    if isinstance(val, list):
                        projects = val
                        break
    elif path.suffix.lower() == ".csv":
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            projects = list(reader)
    else:
        raise ValueError(f"Unsupported file format: {path.suffix}. Please provide a .json or .csv file.")

    logger.info(f"Loaded {len(projects)} raw records from dataset.")
    return projects

def ingest_historical_dataset(
    dataset_path: Union[str, Path] = settings.DATA_DIR / "sample_projects.json",
    collection_name: str = COLLECTION_DEVPOST
) -> Dict[str, Any]:
    """
    Ingests and indexes historical hackathon projects into ChromaDB.
    Supports incremental additions and deduplication.
    """
    raw_projects = load_projects_from_file(dataset_path)
    if not raw_projects:
        logger.warning("No projects found in dataset file.")
        return {"total_records": 0, "chunks_added": 0, "status": "empty"}

    # Process, normalize and chunk documents
    chunks = document_processor.process_project_documents(raw_projects)
    
    # Insert with deduplication into vector store
    new_chunks_count = vector_store_manager.add_documents(chunks, collection_name=collection_name)

    stats = {
        "dataset_path": str(dataset_path),
        "total_records": len(raw_projects),
        "total_chunks_processed": len(chunks),
        "new_chunks_indexed": new_chunks_count,
        "collection_name": collection_name,
        "status": "success"
    }
    logger.info(f"Ingestion complete: {stats}")
    return stats
