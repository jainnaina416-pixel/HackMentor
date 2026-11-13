import hashlib
from typing import Dict, Any, List, Optional
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings
from app.core.logging import logger

def generate_doc_id(content: str, source: str) -> str:
    """Generates a unique deterministic ID using SHA-256."""
    h = hashlib.sha256()
    h.update(f"{source}:{content}".encode("utf-8"))
    return h.hexdigest()[:24]

class DocumentProcessor:
    def __init__(self, chunk_size: int = settings.RAG_CHUNK_SIZE, chunk_overlap: int = settings.RAG_CHUNK_OVERLAP):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def normalize_devpost_project(self, raw: Dict[str, Any]) -> Optional[Document]:
        """
        Dynamically inspects and normalizes raw Devpost project data into a Document.
        Handles flexible schema variants (e.g. title vs name, tech_stack vs technologies).
        """
        # Dynamic key resolution
        title = raw.get("title") or raw.get("name") or raw.get("project_title") or "Untitled Project"
        tagline = raw.get("tagline") or raw.get("short_description") or raw.get("summary") or ""
        description = raw.get("description") or raw.get("body") or raw.get("about") or raw.get("readme") or ""
        
        # Technologies / Tags
        tech = raw.get("technologies") or raw.get("tech_stack") or raw.get("built_with") or []
        if isinstance(tech, str):
            tech = [t.strip() for t in tech.split(",") if t.strip()]

        tags = raw.get("tags") or raw.get("categories") or []
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]

        # Awards / Outcomes
        awards = raw.get("awards") or raw.get("winner") or raw.get("prizes") or []
        if isinstance(awards, str):
            awards = [awards] if awards else []

        url = raw.get("url") or raw.get("devpost_url") or raw.get("source_url") or ""

        # Skip entries that have almost no content
        if not tagline and not description:
            return None

        # Build clean search-optimized document text
        content_lines = [
            f"Project: {title}",
            f"Summary: {tagline}" if tagline else "",
            f"Built With: {', '.join(tech)}" if tech else "",
            f"Awards & Recognition: {', '.join(awards)}" if awards else "",
            f"Details:\n{description}" if description else "",
        ]
        page_content = "\n\n".join([line for line in content_lines if line])

        metadata = {
            "title": str(title),
            "tagline": str(tagline),
            "technologies": ", ".join(tech),
            "awards": ", ".join(awards),
            "url": str(url),
            "source": "devpost_historical",
            "doc_id": generate_doc_id(page_content, str(title)),
        }

        return Document(page_content=page_content, metadata=metadata)

    def process_project_documents(self, raw_projects: List[Dict[str, Any]]) -> List[Document]:
        """Processes a list of raw historical projects and chunks them."""
        processed_chunks: List[Document] = []
        seen_ids = set()

        for raw in raw_projects:
            doc = self.normalize_devpost_project(raw)
            if not doc:
                continue
            
            # Deduplicate by content hash
            doc_id = doc.metadata["doc_id"]
            if doc_id in seen_ids:
                continue
            seen_ids.add(doc_id)

            # Split into chunks if large
            chunks = self.splitter.split_documents([doc])
            for i, chunk in enumerate(chunks):
                chunk.metadata["chunk_index"] = i
                chunk.metadata["total_chunks"] = len(chunks)
                processed_chunks.append(chunk)

        logger.info(f"Normalized {len(raw_projects)} projects into {len(processed_chunks)} searchable chunks.")
        return processed_chunks

    def process_team_pdf_text(self, text: str, project_id: str, filename: str) -> List[Document]:
        """Processes and chunks uploaded PDF text for project-specific RAG."""
        if not text.strip():
            return []

        doc = Document(
            page_content=text,
            metadata={
                "project_id": project_id,
                "filename": filename,
                "source": "team_upload",
            }
        )

        chunks = self.splitter.split_documents([doc])
        for i, chunk in enumerate(chunks):
            chunk.metadata["chunk_index"] = i
            chunk.metadata["chunk_id"] = f"{project_id}_{filename}_{i}"
        return chunks

document_processor = DocumentProcessor()
