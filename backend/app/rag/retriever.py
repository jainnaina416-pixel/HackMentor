from typing import List, Dict, Any, Tuple, Optional
from langchain_core.documents import Document

from app.core.config import settings
from app.core.logging import logger
from app.models.responses import SimilarProjectItem, SourceCitation
from app.rag.vector_store import vector_store_manager, COLLECTION_DEVPOST

class HackathonRetriever:
    def __init__(self, top_k: int = settings.RAG_RETRIEVAL_TOP_K):
        self.top_k = top_k
        self.vector_store = vector_store_manager

    def retrieve_historical_projects(self, query: str, top_k: Optional[int] = None) -> List[Tuple[Document, float]]:
        """Retrieves top historical hackathon projects relevant to the query."""
        k = top_k or self.top_k
        results = self.vector_store.search_similar(query, collection_name=COLLECTION_DEVPOST, k=k)
        logger.info(f"Retrieved {len(results)} historical projects for query '{query[:60]}...'")
        return results

    def retrieve_team_documents(self, query: str, project_id: str, top_k: int = 3) -> List[Tuple[Document, float]]:
        """Retrieves chunks from the team's uploaded PDFs."""
        col_name = f"project_documents_{project_id}"
        results = self.vector_store.search_similar(query, collection_name=col_name, k=top_k)
        logger.info(f"Retrieved {len(results)} team doc chunks for project {project_id}")
        return results

    def to_similar_project_items(self, results: List[Tuple[Document, float]]) -> List[SimilarProjectItem]:
        """Converts retrieved documents into SimilarProjectItem models."""
        items = []
        for doc, score in results:
            tech_str = doc.metadata.get("technologies", "")
            tech_list = [t.strip() for t in tech_str.split(",") if t.strip()]
            awards_str = doc.metadata.get("awards", "")
            awards_list = [a.strip() for a in awards_str.split(",") if a.strip()]

            items.append(SimilarProjectItem(
                title=doc.metadata.get("title", "Historical Project"),
                summary=doc.metadata.get("tagline") or doc.page_content[:200],
                relevance_score=round(float(score), 3) if score is not None else None,
                technologies=tech_list,
                awards=awards_list,
                source_url=doc.metadata.get("url") or None,
            ))
        return items

    def to_source_citations(self, results: List[Tuple[Document, float]]) -> List[SourceCitation]:
        """Converts retrieved documents into SourceCitation models."""
        citations = []
        for doc, score in results:
            title = doc.metadata.get("title") or doc.metadata.get("filename") or "Document"
            citations.append(SourceCitation(
                source_id=doc.metadata.get("doc_id") or doc.metadata.get("chunk_id") or "src_unknown",
                title=title,
                excerpt=doc.page_content[:250].strip() + "...",
                relevance=round(float(score), 3) if score is not None else None,
                url=doc.metadata.get("url") or None,
            ))
        return citations

    def format_context_for_prompt(
        self,
        historical_results: List[Tuple[Document, float]],
        team_doc_results: Optional[List[Tuple[Document, float]]] = None
    ) -> str:
        """Formats retrieved chunks into a safe, attribution-preserved context block."""
        parts = []

        if team_doc_results:
            parts.append("### Team Uploaded Documents Context:")
            for i, (doc, score) in enumerate(team_doc_results, 1):
                filename = doc.metadata.get("filename", "upload.pdf")
                parts.append(f"[{i}] Document: {filename}\nContent:\n{doc.page_content.strip()}")

        if historical_results:
            parts.append("### Relevant Historical Hackathon Projects (from Devpost):")
            for i, (doc, score) in enumerate(historical_results, 1):
                title = doc.metadata.get("title", "Project")
                tech = doc.metadata.get("technologies", "")
                awards = doc.metadata.get("awards", "")
                score_str = f" (Similarity: {score:.2f})" if score is not None else ""
                
                header = f"[{i}] {title}{score_str}"
                if tech:
                    header += f" | Built with: {tech}"
                if awards:
                    header += f" | Awards: {awards}"
                parts.append(f"{header}\n{doc.page_content.strip()}")

        if not parts:
            return "No previous historical projects or uploaded documents matched this query."

        return "\n\n".join(parts)

retriever = HackathonRetriever()
