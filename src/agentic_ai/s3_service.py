import os
import io
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("agentic_ai.s3_service")

# Lazy imports for AWS boto3 and PDF reader
try:
    import boto3
    from botocore.config import Config
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

S3_BUCKET = os.getenv("AWS_S3_BUCKET_NAME", "hackmentor-uploads")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

def get_s3_client():
    if not HAS_BOTO3:
        return None
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    if not aws_access_key or not aws_secret_key:
        return None
    return boto3.client(
        "s3",
        region_name=AWS_REGION,
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        config=Config(signature_version="s3v4"),
    )

def generate_presigned_upload_url(kind: str, file_name: str, content_type: str) -> Dict[str, Any]:
    """Generates an AWS S3 presigned PUT URL for uploading PDF documents."""
    key = f"uploads/{kind}/{file_name}"
    s3 = get_s3_client()
    
    if s3:
        try:
            url = s3.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": S3_BUCKET,
                    "Key": key,
                    "ContentType": content_type,
                },
                ExpiresIn=300,
            )
            return {
                "uploadUrl": url,
                "method": "PUT",
                "bucket": S3_BUCKET,
                "key": key,
                "headers": {"Content-Type": content_type},
            }
        except Exception as e:
            logger.error(f"S3 Presign generation failed: {e}")

    # Local fallback URL if AWS credentials are not configured yet
    return {
        "uploadUrl": f"http://localhost:8000/api/uploads/mock-put?key={key}",
        "method": "PUT",
        "bucket": S3_BUCKET,
        "key": key,
        "headers": {"Content-Type": content_type},
    }

def extract_pdf_text_from_s3(key: str) -> Optional[str]:
    """Downloads and extracts plain text from an S3 uploaded PDF document."""
    s3 = get_s3_client()
    if not s3 or not HAS_PYPDF:
        return None
    try:
        response = s3.get_object(Bucket=S3_BUCKET, Key=key)
        pdf_bytes = response["Body"].read()
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted = [page.extract_text() for page in reader.pages if page.extract_text()]
        return "\n".join(extracted)
    except Exception as e:
        logger.error(f"Failed to read PDF from S3: {e}")
        return None
