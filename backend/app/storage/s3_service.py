"""S3 helpers for original PDF storage.

Uses the default boto3 credential provider chain (shared config, env, IAM).
Does not read access keys from application .env files.
"""
from __future__ import annotations

import uuid
from typing import Any, Dict

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

from app.core.config import settings
from app.core.logging import logger
from app.storage.local_storage import sanitize_filename


class S3UploadError(Exception):
    """Raised when the original PDF cannot be stored in S3."""


def get_s3_client():
    """Create an S3 client with the default AWS credential chain."""
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        config=Config(signature_version="s3v4"),
    )


def check_s3_connection() -> Dict[str, Any]:
    """Verify credentials can reach the configured private bucket."""
    client = get_s3_client()
    bucket = settings.AWS_S3_BUCKET
    try:
        client.head_bucket(Bucket=bucket)
        return {"ok": True, "bucket": bucket, "region": settings.AWS_REGION}
    except NoCredentialsError as exc:
        raise S3UploadError(
            "AWS credentials were not found. Configure them with the AWS CLI "
            "(aws configure) on this machine."
        ) from exc
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        raise S3UploadError(
            f"Cannot access S3 bucket '{bucket}' ({code}). "
            "Confirm the bucket exists in us-east-1 and this profile can write to it."
        ) from exc
    except BotoCoreError as exc:
        raise S3UploadError(f"AWS S3 connection failed: {exc}") from exc


def build_object_key(kind: str, filename: str, project_id: str) -> str:
    clean = sanitize_filename(filename)
    # Flatter structure: directly under uploads/ so it is immediately visible in AWS S3 Console
    return f"uploads/{clean}"


def upload_pdf_bytes(
    file_bytes: bytes,
    filename: str,
    kind: str,
    project_id: str,
) -> Dict[str, str]:
    """Store the original PDF privately in S3. Does not set a public ACL."""
    client = get_s3_client()
    bucket = settings.AWS_S3_BUCKET
    key = build_object_key(kind, filename, project_id)

    try:
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=file_bytes,
            ContentType="application/pdf",
            ContentDisposition=f'attachment; filename="{sanitize_filename(filename)}"',
        )
    except NoCredentialsError as exc:
        raise S3UploadError(
            "AWS credentials were not found. Configure them with the AWS CLI "
            "(aws configure) on this machine."
        ) from exc
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        raise S3UploadError(f"S3 upload failed ({code}) for s3://{bucket}/{key}.") from exc
    except BotoCoreError as exc:
        raise S3UploadError(f"S3 upload failed: {exc}") from exc

    logger.info("Stored original PDF in S3: s3://%s/%s (%s bytes)", bucket, key, len(file_bytes))
    return {"bucket": bucket, "key": key, "uri": f"s3://{bucket}/{key}"}
