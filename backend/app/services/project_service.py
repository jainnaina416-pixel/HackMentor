import json
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from app.core.database import (
    save_project,
    get_project_by_id,
    get_project_documents,
    get_conversation_messages
)
from app.core.logging import logger
from app.rag.document_processor import document_processor
from app.rag.vector_store import vector_store_manager

class ProjectService:
    def create_or_update_project(
        self,
        project_id: Optional[str],
        name: str,
        problem_statement: str,
        solution: str = "",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Creates or updates a hackathon project record in SQLite."""
        pid = project_id or f"proj_{uuid.uuid4().hex[:8]}"
        meta = metadata or {}
        
        save_project(
            project_id=pid,
            name=name or "Hackathon Project",
            problem_statement=problem_statement or "",
            solution=solution or "",
            metadata=meta
        )
        logger.info(f"Saved project: {pid} ({name})")
        return self.get_project(pid)

    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves project details including uploaded documents and team metadata."""
        record = get_project_by_id(project_id)
        if not record:
            return None
        
        # Attach uploaded documents
        docs = get_project_documents(project_id)
        record["documents"] = docs
        return record

    def index_pdf_document(self, project_id: str, filename: str, extracted_text: str) -> int:
        """Chunks and indexes an uploaded PDF's text into ChromaDB for project-specific RAG."""
        if not extracted_text.strip():
            return 0

        chunks = document_processor.process_team_pdf_text(
            text=extracted_text,
            project_id=project_id,
            filename=filename
        )
        collection_name = f"project_documents_{project_id}"
        added = vector_store_manager.add_documents(chunks, collection_name=collection_name)
        logger.info(f"Indexed {added} chunks from '{filename}' into vector collection '{collection_name}'.")
        return added

project_service = ProjectService()
