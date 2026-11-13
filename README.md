# HackMentor 🚀

**AI-Powered Hackathon Project Mentor**

HackMentor is an AI-powered platform designed to help hackathon teams manage their projects, track progress, generate roadmaps, review ideas, and access intelligent project guidance.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Python, FastAPI
- **AI:** Agentic AI, RAG, LLM integration
- **Storage:** Local Storage / AWS S3 integration

## Project Structure

```text
Agentic ai/
├── backend/
│   └── app/
│       └── main.py
├── hackmentor/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── src/
│   └── agentic_ai/
├── main.py
├── requirements.txt
└── README.md
```

## Prerequisites

- Python 3.11+
- Node.js and npm
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/jainnaina416-pixel/HackMentor.git
cd HackMentor
```

### 2. Backend Setup

Open a terminal in the project root:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

Configure your environment variables using the provided `.env.example` files.

Start the FastAPI backend:

```powershell
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend URL: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

### 3. Frontend Setup

Open a **second terminal** in the project root:

```powershell
cd hackmentor
npm install
npm run dev
```

Frontend URL: http://localhost:5173

## Running the Application

Keep both terminals running:

| Service | Command | Port |
|---|---|---|
| Backend | `python -m uvicorn backend.app.main:app --reload` | 8000 |
| Frontend | `npm run dev` | 5173 |

## Environment Variables

Add the required API keys and configuration to your local `.env` files. Never commit real API keys or credentials to GitHub.

## Contributing

Contributions, suggestions, and improvements are welcome!

## Author

**Naina Jain**

GitHub: [jainnaina416-pixel](https://github.com/jainnaina416-pixel)

---

*Built to help hackathon teams turn ideas into successful projects.*
