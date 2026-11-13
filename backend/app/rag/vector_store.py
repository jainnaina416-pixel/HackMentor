import chromadb
from typing import List, Tuple, Optional
from langchain_core.documents import Document
from langchain_chroma import Chroma

from app.core.config import settings
from app.core.logging import logger
from app.rag.embeddings import get_embedding_model

COLLECTION_DEVPOST = "devpost_historical_projects"

class VectorStoreManager:
    def __init__(self, persist_dir: str = str(settings.CHROMA_PERSIST_DIR)):
        self.persist_dir = persist_dir
        self.chroma_client = chromadb.PersistentClient(path=self.persist_dir)
        self.embeddings = get_embedding_model()

    def get_collection(self, collection_name: str = COLLECTION_DEVPOST) -> Chroma:
        """Returns a LangChain Chroma vector store instance."""
        return Chroma(
            client=self.chroma_client,
            collection_name=collection_name,
            embedding_function=self.embeddings,
        )

    def add_documents(
        self,
        documents: List[Document],
        collection_name: str = COLLECTION_DEVPOST
    ) -> int:
        """Adds documents to the collection with deduplication by ID."""
        if not documents:
            return 0

        vector_store = self.get_collection(collection_name)
        
        # Prepare unique IDs based on doc metadata or content hash
        ids = []
        for i, doc in enumerate(documents):
            chunk_id = doc.metadata.get("chunk_id") or doc.metadata.get("doc_id")
            if chunk_id and "chunk_index" in doc.metadata:
                ids.append(f"{chunk_id}_chunk_{doc.metadata['chunk_index']}")
            elif chunk_id:
                ids.append(f"{chunk_id}_{i}")
            else:
                ids.append(f"doc_{collection_name}_{i}_{hash(doc.page_content)}")

        # Check existing IDs in Chroma collection
        try:
            col = self.chroma_client.get_collection(name=collection_name)
            existing_ids = set(col.get()["ids"])
        except Exception:
            existing_ids = set()

        new_docs = []
        new_ids = []
        for doc, doc_id in zip(documents, ids):
            if doc_id not in existing_ids:
                new_docs.append(doc)
                new_ids.append(doc_id)

        if not new_docs:
            logger.info(f"No new documents to insert into {collection_name}. All {len(documents)} already exist.")
            return 0

        vector_store.add_documents(documents=new_docs, ids=new_ids)
        logger.info(f"Inserted {len(new_docs)} new document chunks into collection '{collection_name}'.")
        return len(new_docs)

    def search_similar(
        self,
        query: str,
        collection_name: str = COLLECTION_DEVPOST,
        k: int = settings.RAG_RETRIEVAL_TOP_K
    ) -> List[Tuple[Document, float]]:
        """Searches for similar documents returning (Document, relevance_score) pairs."""
        try:
            vector_store = self.get_collection(collection_name)
            raw_results = vector_store.similarity_search_with_score(query, k=k)
            normalized = []
            for doc, dist in raw_results:
                # Convert distance to similarity score clamped strictly to [0.0, 1.0]
                score = round(max(0.0, min(1.0, 1.0 / (1.0 + max(0.0, float(dist))))), 3)
                normalized.append((doc, score))
            return normalized
        except Exception as e:
            logger.warning(f"Vector search failed on '{collection_name}': {e}. Returning empty list.")
            return []

    def get_stats(self) -> dict:
        """Returns collection names and document counts for monitoring."""
        stats = {}
        for col in self.chroma_client.list_collections():
            stats[col.name] = col.count()
        return stats

vector_store_manager = VectorStoreManager()
