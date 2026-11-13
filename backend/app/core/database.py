import sqlite3
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.core.config import settings

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        problem_statement TEXT,
        solution TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        extracted_text TEXT,
        page_count INTEGER DEFAULT 1,
        is_ocr_required INTEGER DEFAULT 0,
        uploaded_at TEXT NOT NULL,
        FOREIGN KEY(project_id) REFERENCES projects(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(project_id) REFERENCES projects(id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        sources_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    );
    """)

    conn.commit()
    conn.close()

# Helper queries
def save_project(project_id: str, name: str, problem_statement: str, solution: str, metadata: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO projects (id, name, problem_statement, solution, metadata_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        problem_statement=excluded.problem_statement,
        solution=excluded.solution,
        metadata_json=excluded.metadata_json,
        updated_at=excluded.updated_at
    """, (project_id, name, problem_statement, solution, json.dumps(metadata), now, now))
    conn.commit()
    conn.close()

def get_project_by_id(project_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    data = dict(row)
    data["metadata"] = json.loads(data["metadata_json"]) if data.get("metadata_json") else {}
    return data

def save_document_record(
    doc_id: str,
    project_id: str,
    filename: str,
    file_path: str,
    file_size: int,
    extracted_text: str,
    page_count: int,
    is_ocr_required: bool
):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO documents (id, project_id, filename, file_path, file_size, extracted_text, page_count, is_ocr_required, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        extracted_text=excluded.extracted_text,
        page_count=excluded.page_count,
        is_ocr_required=excluded.is_ocr_required
    """, (doc_id, project_id, filename, file_path, file_size, extracted_text, page_count, 1 if is_ocr_required else 0, now))
    conn.commit()
    conn.close()

def get_project_documents(project_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE project_id = ? ORDER BY uploaded_at DESC", (project_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def ensure_conversation(conversation_id: str, project_id: str = "default_project"):
    """Upserts a conversations row so messages always have a valid parent."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO conversations (id, project_id, created_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO NOTHING
    """, (conversation_id, project_id, now))
    conn.commit()
    conn.close()

def save_message(message_id: str, conversation_id: str, role: str, content: str,
                 sources: Optional[List[Dict[str, Any]]] = None, project_id: str = "default_project"):
    ensure_conversation(conversation_id, project_id)
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO messages (id, conversation_id, role, content, sources_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (message_id, conversation_id, role, content, json.dumps(sources or []), now))
    conn.commit()
    conn.close()

def get_conversation_messages(conversation_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", (conversation_id,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["sources"] = json.loads(d["sources_json"]) if d.get("sources_json") else []
        results.append(d)
    return results

# Initialize tables on import
try:
    init_db()
except Exception:
    pass

