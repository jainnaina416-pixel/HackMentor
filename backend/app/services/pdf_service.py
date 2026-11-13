import uuid
from typing import Tuple, Dict, Any, Optional
from fastapi import UploadFile, HTTPException

from app.core.config import settings
from app.core.logging import logger
from app.core.database import save_document_record
from app.storage.local_storage import get_storage_backend, sanitize_filename
from app.storage.s3_service import S3UploadError, upload_pdf_bytes

# Lazy PDF imports
try:
    import pymupdf
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

class PDFExtractionError(Exception):
    pass

class PDFService:
    def __init__(self):
        self.storage = get_storage_backend()

    def validate_pdf(self, file: UploadFile, file_bytes: bytes) -> None:
        """Validates PDF content-type, magic bytes, and file size."""
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files (.pdf) are accepted.")

        if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
            max_mb = settings.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum size limit of {max_mb:.0f} MB."
            )

        # Check PDF magic bytes (%PDF-)
        if not file_bytes.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=400,
                detail="Invalid file format: file does not contain a valid PDF signature."
            )

    def extract_text(self, file_bytes: bytes) -> Tuple[str, int, bool]:
        """
        Extracts plain text from PDF bytes.
        Returns: (extracted_text, page_count, is_ocr_required)
        """
        text_parts = []
        page_count = 0

        if HAS_PYMUPDF:
            try:
                doc = pymupdf.open(stream=file_bytes, filetype="pdf")
                page_count = len(doc)
                for page in doc:
                    page_text = page.get_text()
                    if page_text:
                        text_parts.append(page_text.strip())
                doc.close()
            except Exception as e:
                logger.warning(f"PyMuPDF failed to parse PDF: {e}. Falling back to pypdf.")

        if not text_parts and HAS_PYPDF:
            try:
                import io
                reader = PdfReader(io.BytesIO(file_bytes))
                page_count = len(reader.pages)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text.strip())
            except Exception as e:
                logger.error(f"pypdf extraction failed: {e}")

        full_text = "\n\n".join(text_parts).strip()
        
        # Check if PDF is scanned or image-only
        is_ocr_required = False
        if len(full_text) < 30:
            is_ocr_required = True
            logger.info("PDF has very low or zero extracted text; flagging OCR as required.")

        return full_text, page_count, is_ocr_required

    async def process_pdf_upload(
        self,
        file: UploadFile,
        project_id: str,
        kind: str = "project_document"
    ) -> Dict[str, Any]:
        """Processes and stores a PDF upload, saving extracted text for RAG."""
        file_bytes = await file.read()
        self.validate_pdf(file, file_bytes)

        # Extract text and assess OCR need
        extracted_text, page_count, is_ocr_required = self.extract_text(file_bytes)

        # Save file to storage (local copy kept for extraction/RAG tooling)
        clean_name = sanitize_filename(file.filename)
        subfolder = f"projects/{project_id}"
        relative_key, file_path = self.storage.save_file(file_bytes, clean_name, subfolder)

        try:
            s3_info = upload_pdf_bytes(
                file_bytes=file_bytes,
                filename=clean_name,
                kind=kind,
                project_id=project_id,
            )
        except S3UploadError as exc:
            logger.error("S3 upload failed for %s: %s", clean_name, exc)
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        doc_id = f"doc_{uuid.uuid4().hex[:12]}"
        
        # Record in database
        save_document_record(
            doc_id=doc_id,
            project_id=project_id,
            filename=clean_name,
            file_path=file_path,
            file_size=len(file_bytes),
            extracted_text=extracted_text,
            page_count=page_count,
            is_ocr_required=is_ocr_required
        )

        status_msg = (
            f"PDF uploaded successfully to s3://{s3_info['bucket']}/{s3_info['key']}."
            if not is_ocr_required
            else (
                f"PDF uploaded successfully to s3://{s3_info['bucket']}/{s3_info['key']}, "
                "but the document appears to be scanned or image-only. Text could not be extracted without OCR."
            )
        )

        logger.info(f"Processed PDF upload for project {project_id}: {clean_name} ({len(file_bytes)} bytes, {page_count} pages)")

        return {
            "document_id": doc_id,
            "project_id": project_id,
            "filename": clean_name,
            "file_size": len(file_bytes),
            "extracted_text_preview": extracted_text[:300] if extracted_text else "",
            "full_text": extracted_text,
            "page_count": page_count,
            "is_ocr_required": is_ocr_required,
            "status_message": status_msg,
            "file_path": file_path,
            "relative_key": relative_key,
            "bucket": s3_info["bucket"],
            "s3_key": s3_info["key"],
            "s3_uri": s3_info["uri"],
        }

pdf_service = PDFService()
