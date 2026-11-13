import pytest
from app.rag.document_processor import document_processor
from app.rag.vector_store import vector_store_manager, COLLECTION_DEVPOST
from app.rag.retriever import retriever

def test_document_processor_normalization():
    raw = {
        "title": "EcoSort AI",
        "tagline": "Real-time waste segregation using edge computer vision.",
        "description": "EcoSort uses a Raspberry Pi and webcam to classify recyclable vs compostable waste.",
        "technologies": ["Python", "OpenCV", "FastAPI"],
        "awards": ["Best Environmental Hack"]
    }
    doc = document_processor.normalize_devpost_project(raw)
    assert doc is not None
    assert doc.metadata["title"] == "EcoSort AI"
    assert "OpenCV" in doc.metadata["technologies"]
    assert "Best Environmental Hack" in doc.metadata["awards"]
    assert "EcoSort uses a Raspberry Pi" in doc.page_content

def test_document_chunking():
    long_text = "Hackathon MVP feature definition. " * 100
    chunks = document_processor.process_team_pdf_text(
        text=long_text,
        project_id="test_proj",
        filename="specs.pdf"
    )
    assert len(chunks) > 1
    assert chunks[0].metadata["filename"] == "specs.pdf"
    assert chunks[0].metadata["project_id"] == "test_proj"

def test_vector_store_retrieval():
    # Search for an agricultural topic in the ingested sample projects
    query = "crop leaf disease diagnosis offline"
    results = retriever.retrieve_historical_projects(query, top_k=2)
    
    assert len(results) > 0
    top_doc, score = results[0]
    assert top_doc is not None
    assert "CropGuard" in top_doc.metadata.get("title", "")
    assert "devpost_historical" in top_doc.metadata.get("source", "")

    # Test conversion to response models
    similar_items = retriever.to_similar_project_items(results)
    assert len(similar_items) > 0
    assert similar_items[0].title == "CropGuard AI"
    assert "TensorFlow Lite" in similar_items[0].technologies
