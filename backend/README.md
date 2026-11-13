# HackMentor Backend — RAG-Powered AI Hackathon Mentor

A modular, production-ready FastAPI backend designed to empower hackathon teams from problem validation to winning pitch presentations. HackMentor leverages **Retrieval-Augmented Generation (RAG)** over historical hackathon projects (Devpost datasets) and uploaded team PDF documents to provide grounded, highly actionable mentorship.

---

## 1. System Architecture

```
[ React / Vite Frontend ]
        │  ▲
   REST │  │ Server-Sent Events (SSE)
        ▼  │
┌────────────────────────────────────────────────────────┐
│                   FastAPI Application                  │
│                                                        │
│  [ Routers: Health, Problem, Mentor, Review, Pitch ]   │
│                          │                             │
│  [ Services: Analysis, Mentor, Review, Pitch, PDF ]    │
│            │                           │               │
│            ▼                           ▼               │
│   [ LangChain LLM ]           [ RAG Pipeline ]         │
│   (Groq / Gemini / OpenAI)    ├── Retriever            │
│                               ├── Document Processor   │
│                               ├── Embeddings Factory   │
│                               └── ChromaDB (Vectors)   │
│                                                        │
│  [ Local Storage (Uploads) ]  [ SQLite Database ]      │
└────────────────────────────────────────────────────────┘
```

### Module Responsibilities:
- **`app/core/`**: Configuration (`config.py`), logging (`logging.py`), SQLite tables (`database.py`), and LLM provider factory (`llm.py`).
- **`app/storage/`**: `local_storage.py` abstracts file saving behind a `StorageBackend` interface, allowing plug-and-play migration to AWS S3 without rewriting business logic.
- **`app/services/pdf_service.py`**: Validates PDF signatures (`%PDF-`), enforces size limits, extracts text via PyMuPDF (`fitz`), and detects scanned/image-only PDFs gracefully.
- **`app/rag/`**:
  - `document_processor.py`: Dynamic schema inspector & chunker using `RecursiveCharacterTextSplitter`.
  - `embeddings.py`: Modular embeddings supporting Google, OpenAI, HuggingFace, and an offline deterministic vectorizer.
  - `vector_store.py`: Persistent ChromaDB manager supporting collections for shared Devpost historical projects and project-specific uploads.
  - `retriever.py`: Similarity search with score normalization (0 to 1), source metadata preservation, and safe prompt formatting.
  - `prompts.py`: Strict system prompts and guardrails preventing prompt injection and hallucinated judge scores.
- **`app/api/routes/`**: FastAPI endpoints mapped cleanly to the 4 core features and frontend needs.

---

## 2. Quickstart & Installation

### Prerequisites
- Python 3.11+
- Git

### Installation Steps

```bash
# 1. Clone repository and navigate to backend directory
cd "Agentic ai"

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Configure environment variables
cp backend/.env.example .env
# Edit .env and supply your preferred API key (e.g. GROQ_API_KEY, GOOGLE_API_KEY, or OPENAI_API_KEY)

# 4. Ingest Historical Hackathon Projects Dataset into ChromaDB
python backend/scripts/ingest_dataset.py

# 5. Run the test suite
python -m pytest backend/app/tests -v

# 6. Launch the FastAPI server
python main.py
# Server runs on http://127.0.0.1:8000
# Interactive Swagger Documentation: http://127.0.0.1:8000/docs
```

---

## 3. Environment Configuration (`.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `LLM_PROVIDER` | Chosen LLM engine (`groq`, `google`, `openai`) | `groq` |
| `LLM_MODEL` | Model identifier | `llama-3.3-70b-versatile` |
| `GROQ_API_KEY` | Groq API Key | `gsk_...` |
| `GOOGLE_API_KEY` | Google Gemini API Key | `AIza...` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-proj-...` |
| `EMBEDDING_PROVIDER` | Embedding engine (`default`, `huggingface`, `google`, `openai`) | `default` |
| `CHROMA_PERSIST_DIR` | Directory where ChromaDB vectors persist | `./backend/chroma_db` |
| `UPLOAD_DIR` | Local storage directory for uploaded PDFs | `./backend/uploads` |
| `RAG_CHUNK_SIZE` | Maximum chunk size in characters | `800` |
| `RAG_CHUNK_OVERLAP` | Overlap between consecutive chunks | `150` |
| `RAG_RETRIEVAL_TOP_K` | Number of historical projects to retrieve | `4` |
| `CORS_ORIGINS` | Permitted frontend origins | `http://localhost:5173` |

---

## 4. RAG Knowledge Base Ingestion

The ingestion pipeline (`backend/app/rag/ingest.py`) parses historical hackathon datasets (such as `twangodev/devpost-hacks`):
1. Dynamically detects available columns (`title`, `tagline`, `description`, `built_with`, `awards`, `url`).
2. Deduplicates records via SHA-256 content hashing.
3. Generates vector embeddings.
4. Stores chunks into the persistent ChromaDB collection `devpost_historical_projects`.

### Ingestion Command:
```bash
# Ingest default sample dataset
python backend/scripts/ingest_dataset.py

# Ingest custom or downloaded Devpost dataset
python backend/scripts/ingest_dataset.py --file path/to/devpost_dataset.json
```

---

## 5. Core API Endpoints

### A. Health Check
- **`GET /api/health`**
- Returns backend operational status, active LLM provider, vector database health, and SQLite status.

### B. Problem / Idea Analysis
- **`POST /api/problem/analyze`**
- **Request Body**:
  ```json
  {
    "project_id": "proj_101",
    "problemStatement": "Smallholder farmers lose harvest to crop diseases identified too late due to lack of local labs.",
    "projectIdea": "CropGuard: an offline-first mobile app classifying leaf images with local language advice."
  }
  ```
- **Response**:
  ```json
  {
    "simpleWords": "Smallholder farmers lose significant yield because they lack accessible crop diagnosis tools.",
    "targetUsers": ["Rural farmers", "Agricultural volunteers"],
    "requirements": ["Offline leaf image classification", "Local language guidance cards", "Confidence scoring"],
    "constraints": ["Low connectivity", "Inexpensive mobile phones"],
    "coreProblem": "Late disease identification with hard-to-action field advice.",
    "similar_historical_projects": [
      {
        "title": "CropGuard AI",
        "summary": "Offline-first mobile web app for leaf disease classification.",
        "relevance_score": 0.912,
        "technologies": ["React", "FastAPI", "TensorFlow Lite"],
        "awards": ["1st Place Overall"]
      }
    ],
    "importantQuestions": ["Which 3 crops are strictly in scope for the demo?"],
    "risks": ["Scope creep across too many languages"],
    "possibleDirections": ["Quantized on-device classifier"],
    "sources_used": [
      {
        "source_id": "490424db86f9",
        "title": "CropGuard AI",
        "excerpt": "CropGuard runs a quantized TFLite model directly inside the browser...",
        "relevance": 0.912,
        "url": "https://devpost.com/software/cropguard-ai"
      }
    ]
  }
  ```

### C. Ask Mentor (with SSE Streaming)
- **`POST /api/mentor/chat`**
- **Request Body**:
  ```json
  {
    "project_id": "proj_101",
    "message": "Are we over-scoping this project if we build custom hardware?",
    "stream": true
  }
  ```
- **Response**: Server-Sent Events (`text/event-stream`) token-by-token or JSON with citations:
  ```json
  {
    "message": "For a 36-hour hackathon, cut the custom hardware build! Simulate sensor readings using a mock script and focus on a clean dashboard showing live energy savings.",
    "conversation_id": "conv_a8f9c2",
    "sources": [...]
  }
  ```

### D. Project Review
- **`POST /api/project/review`**
- **Request Body**:
  ```json
  {
    "project_id": "proj_101",
    "solution": "IoT energy monitoring dashboard",
    "architecture": "FastAPI + React + MQTT",
    "knownTechnologies": ["Python", "React", "FastAPI"]
  }
  ```
- **Response**: Structured evaluation assessing Problem-Solution Fit, Feasibility, Innovation, Completeness, UX, Risks, and Recommended Next Steps benchmarked against historical hackathon data.

### E. Pitch Generation
- **`POST /api/pitch/generate`**
- **Request Body**:
  ```json
  {
    "project_id": "proj_101",
    "solution": "EcoSense smart campus energy saver",
    "target_audience": "Hackathon Judges",
    "pitch_duration": "3 minutes"
  }
  ```
- **Response**: Complete pitch deck structure, 30-second elevator pitch, demo sequence, technical explanation, and anticipated judge Q&A with grounded answers.

### F. PDF Upload
- **`POST /api/upload`** (multipart/form-data)
  - Parameter `file`: PDF binary (validated for magic bytes `%PDF-` and $\le$ 10 MB).
  - Parameter `project_id`: Team project ID.
  - Returns document metadata, preview, and flags `is_ocr_required=true` if scanned.
  - Automatically indexes text into the project's ChromaDB collection for RAG.

---

## 6. Testing

The test suite covers PDF extraction, document chunking, vector retrieval, and API endpoint contracts:

```bash
# Run all tests
python -m pytest backend/app/tests -v
```

All 14 unit and integration tests execute with mocked LLM instances to guarantee fast, zero-cost, and reliable test passes.

---

## 7. Extending to Agentic AI (LangGraph)

This architecture was designed to transition into a multi-agent system:
1. **Tool Definitions**: Wrap `retriever.retrieve_historical_projects` and `pdf_service.extract_text` as LangChain Tools (`@tool`).
2. **State Graph**: Use `ProjectState` as the central LangGraph state object.
3. **Supervisor Agent**: Route user queries dynamically between `AnalysisAgent`, `ScopingAgent`, `CodeReviewAgent`, and `PitchAgent`.
