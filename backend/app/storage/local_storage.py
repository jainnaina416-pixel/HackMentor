import os
import uuid
import re
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Tuple
from app.core.config import settings

def sanitize_filename(filename: str) -> str:
    """Removes path traversal and non-standard characters from filenames."""
    filename = Path(filename).name
    # Keep alphanumeric, dots, underscores, dashes
    clean = re.sub(r"[^\w.\-]", "_", filename)
    return clean or "document.pdf"

class StorageBackend(ABC):
    @abstractmethod
    def save_file(self, file_bytes: bytes, filename: str, subfolder: str = "") -> Tuple[str, str]:
        """Saves file bytes and returns (relative_key, absolute_path_or_uri)."""
        pass

    @abstractmethod
    def read_file(self, file_path_or_key: str) -> bytes:
        """Reads file bytes from storage."""
        pass

    @abstractmethod
    def delete_file(self, file_path_or_key: str) -> bool:
        """Deletes file from storage."""
        pass

class LocalStorageBackend(StorageBackend):
    def __init__(self, base_dir: Path = settings.UPLOAD_DIR):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, file_bytes: bytes, filename: str, subfolder: str = "") -> Tuple[str, str]:
        clean_name = sanitize_filename(filename)
        unique_name = f"{uuid.uuid4().hex[:10]}_{clean_name}"
        
        target_dir = self.base_dir / subfolder if subfolder else self.base_dir
        target_dir.mkdir(parents=True, exist_ok=True)
        
        target_path = target_dir / unique_name
        with open(target_path, "wb") as f:
            f.write(file_bytes)
            
        relative_key = str(Path(subfolder) / unique_name).replace("\\", "/")
        return relative_key, str(target_path)

    def read_file(self, file_path_or_key: str) -> bytes:
        p = Path(file_path_or_key)
        if not p.is_absolute():
            p = self.base_dir / p
        if not p.exists():
            raise FileNotFoundError(f"File not found: {file_path_or_key}")
        with open(p, "rb") as f:
            return f.read()

    def delete_file(self, file_path_or_key: str) -> bool:
        p = Path(file_path_or_key)
        if not p.is_absolute():
            p = self.base_dir / p
        if p.exists():
            p.unlink()
            return True
        return False

# Storage Factory (Can be easily extended to return S3StorageBackend when AWS configured)
def get_storage_backend() -> StorageBackend:
    return LocalStorageBackend()
