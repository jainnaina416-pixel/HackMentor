from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, Response

from app.core.config import settings
from app.core.logging import logger
from app.models.requests import PresignUploadRequest, CompleteUploadRequest
from app.models.responses import PDFUploadResponse
from app.services.pdf_service import pdf_service
from app.services.project_service import project_service
from app.storage.s3_service import S3UploadError, check_s3_connection

router = APIRouter(tags=["Uploads"])

@router.post("/api/upload", response_model=PDFUploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    project_id: str = Form(default="default_project"),
    kind: str = Form(default="project_document")
):
    """
    Direct multipart/form-data PDF upload endpoint.
    Extracts text, flags scanned PDFs requiring OCR, stores the file locally,
    and indexes text chunks into ChromaDB for project RAG.
    """
    try:
        result = await pdf_service.process_pdf_upload(file, project_id=project_id, kind=kind)
        
        # Index into ChromaDB project collection if text exists
        if result["full_text"] and not result["is_ocr_required"]:
            project_service.index_pdf_document(
                project_id=project_id,
                filename=result["filename"],
                extracted_text=result["full_text"]
            )

        now = datetime.now(timezone.utc).isoformat()
        return PDFUploadResponse(
            document_id=result["document_id"],
            project_id=result["project_id"],
            filename=result["filename"],
            file_size=result["file_size"],
            extracted_text_preview=result["extracted_text_preview"],
            page_count=result["page_count"],
            is_ocr_required=result["is_ocr_required"],
            status_message=result["status_message"],
            uploaded_at=now,
            bucket=result.get("bucket"),
            s3_key=result.get("s3_key"),
            s3_uri=result.get("s3_uri"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling PDF upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF upload: {str(e)}")

# --- Compatibility Endpoints for Frontend Presigned URL Architecture ---
@router.get("/api/uploads/s3-status")
async def s3_status():
    try:
        info = check_s3_connection()
        return {**info, "message": f"Connected to private bucket {info['bucket']}."}
    except S3UploadError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

@router.put("/api/uploads/mock-put")
async def mock_upload_put(request: Request, key: str = "default.pdf"):
    body = await request.body()
    # Save locally to upload directory
    storage = pdf_service.storage
    clean_key, path = storage.save_file(body, key.split("/")[-1], "mock_uploads")
    
    # Try extracting text from the PDF payload
    text, page_count, ocr = pdf_service.extract_text(body)
    if text and not ocr:
        project_service.index_pdf_document("default_project", key.split("/")[-1], text)

    return {"status": "uploaded", "key": clean_key, "size": len(body), "path": path}

@router.post("/api/uploads/complete")
async def complete_upload(req: CompleteUploadRequest):
    now = datetime.now(timezone.utc).isoformat()
    return {
        "kind": req.kind,
        "key": req.key,
        "bucket": "local-storage",
        "fileName": req.fileName,
        "size": req.size,
        "url": f"http://127.0.0.1:8000/uploads/{req.key}",
        "uploadedAt": now,
        "demo": True,
    }

@router.get("/api/uploads")
async def list_uploads(project_id: str = "default_project"):
    docs = project_service.get_project(project_id)
    return docs.get("documents", []) if docs else []
