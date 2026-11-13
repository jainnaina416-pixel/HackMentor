"""Verify AWS CLI credentials can reach hackmentor-demo-storage and store a PDF."""
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[2]
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from backend.app.storage.s3_service import check_s3_connection, get_s3_client, upload_pdf_bytes
from backend.app.core.config import settings

MINIMAL_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"
)


def main() -> int:
    print(f"Bucket: {settings.AWS_S3_BUCKET}")
    print(f"Region: {settings.AWS_REGION}")
    info = check_s3_connection()
    print(f"Connection: {info}")
    stored = upload_pdf_bytes(
        file_bytes=MINIMAL_PDF,
        filename="hackmentor-s3-connection-test.pdf",
        kind="s3_connection_test",
        project_id="system",
    )
    print(f"Uploaded: {stored['uri']}")
    client = get_s3_client()
    head = client.head_object(Bucket=stored["bucket"], Key=stored["key"])
    print(f"Verified object size: {head['ContentLength']} bytes")
    print("S3 PDF upload test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
