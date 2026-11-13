import io
import pytest
from fastapi import UploadFile, HTTPException
from app.services.pdf_service import pdf_service
from app.storage.local_storage import sanitize_filename

try:
    import pymupdf
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

def create_sample_pdf(text: str = "") -> bytes:
    """Helper to generate a real PDF in memory."""
    if HAS_PYMUPDF:
        doc = pymupdf.open()
        page = doc.new_page()
        if text:
            page.insert_text((50, 72), text)
        data = doc.tobytes()
        doc.close()
        return data
    # Minimal valid empty PDF byte string
    return b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"

def test_sanitize_filename():
    assert sanitize_filename("../../../malicious_file.pdf") == "malicious_file.pdf"
    assert sanitize_filename("my project spec (1).pdf") == "my_project_spec__1_.pdf"
    assert sanitize_filename("") == "document.pdf"

def test_pdf_validation_invalid_type():
    dummy = UploadFile(filename="script.exe", file=io.BytesIO(b"binary"))
    with pytest.raises(HTTPException) as exc:
        pdf_service.validate_pdf(dummy, b"binary")
    assert exc.value.status_code == 400
    assert "Only PDF files" in exc.value.detail

def test_pdf_validation_missing_magic_bytes():
    dummy = UploadFile(filename="fake.pdf", file=io.BytesIO(b"NOT A REAL PDF"))
    with pytest.raises(HTTPException) as exc:
        pdf_service.validate_pdf(dummy, b"NOT A REAL PDF")
    assert exc.value.status_code == 400
    assert "valid PDF signature" in exc.value.detail

def test_pdf_text_extraction():
    sample_text = "HackMentor problem statement: rural healthcare triage assistant with local offline database."
    pdf_bytes = create_sample_pdf(sample_text)
    
    extracted, pages, ocr_needed = pdf_service.extract_text(pdf_bytes)
    assert pages >= 1
    if HAS_PYMUPDF:
        assert "rural healthcare triage" in extracted
        assert ocr_needed is False

def test_scanned_or_empty_pdf_detection():
    # Empty page simulating scanned image without text layer
    pdf_bytes = create_sample_pdf(text="")
    extracted, pages, ocr_needed = pdf_service.extract_text(pdf_bytes)
    assert pages >= 1
    assert ocr_needed is True
