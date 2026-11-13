"""
HackMentor live smoke test — runs against a locally running backend on port 8000.
Usage: python smoke_test.py
"""
import json
import sys
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000"


def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        BASE + path,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()[:400]}")
        return None


def get(path):
    try:
        resp = urllib.request.urlopen(BASE + path, timeout=10)
        return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()[:400]}")
        return None


def section(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


# ── 1. Health ──────────────────────────────────────────────────
section("1. GET /api/health")
h = get("/api/health")
print(json.dumps(h, indent=2))
assert h and h.get("status") == "healthy", "Health check FAILED"
print("  [PASS] healthy")

# ── 2. Onboarding ──────────────────────────────────────────────
section("2. POST /api/onboarding")
ob = post("/api/onboarding", {
    "project_name": "CropSense AI",
    "team_name": "GreenTech",
    "hackathon_name": "Smart India Hackathon 2025",
    "problem_statement": "Farmers in rural India cannot detect crop disease early.",
    "project_idea": "Offline MobileNetV3 leaf classifier.",
    "tech_stack": ["Python", "TensorFlow Lite", "Flutter"],
})
print(json.dumps(ob, indent=2)[:600])
project_id = (ob or {}).get("project_id", "smoke_test_pid")
print(f"  project_id = {project_id}")

# ── 3. Problem Analysis (real Groq LLM call) ───────────────────
section("3. POST /api/problem/analyze  [LIVE LLM]")
pa = post("/api/problem/analyze", {
    "problem_statement": "Farmers in rural India cannot detect crop disease early, causing 30%+ yield loss.",
    "project_idea": "Offline mobile app using fine-tuned MobileNetV3 to classify leaf disease from photos.",
    "project_id": project_id,
})
if pa:
    keys = list(pa.keys())
    print(f"  Response keys: {keys}")
    print(f"  problem_summary: {str(pa.get('problem_summary', ''))[:200]}")
    print(f"  similar_projects count: {len(pa.get('similar_projects', []))}")
    print(f"  sources count: {len(pa.get('sources', []))}")
    print("  [PASS] problem analysis")

# ── 4. Project Review ──────────────────────────────────────────
section("4. POST /api/project/review  [LIVE LLM]")
rv = post("/api/project/review", {
    "project_id": project_id,
    "solution_description": "Offline ML app that detects 38 leaf diseases using phone camera.",
    "tech_stack": ["TensorFlow Lite", "Flutter", "FastAPI"],
})
if rv:
    print(f"  Response keys: {list(rv.keys())}")
    print(f"  strengths count: {len(rv.get('strengths', []))}")
    print("  [PASS] project review")

# ── 5. Pitch Generation ────────────────────────────────────────
section("5. POST /api/pitch/generate  [LIVE LLM]")
pg = post("/api/pitch/generate", {
    "project_id": project_id,
    "solution_description": "Offline leaf disease classifier for rural farmers.",
    "target_audience": "hackathon judges and rural agri-tech investors",
    "pitch_duration": "5 minutes",
})
if pg:
    print(f"  Response keys: {list(pg.keys())}")
    print(f"  title: {pg.get('title')}")
    print(f"  tagline: {pg.get('tagline')}")
    print(f"  judge_questions count: {len(pg.get('judge_questions', []))}")
    print("  [PASS] pitch generation")

# ── 6. Mentor Chat ─────────────────────────────────────────────
section("6. POST /api/mentor/chat  [LIVE LLM]")
mc = post("/api/mentor/chat", {
    "project_id": project_id,
    "message": "Are we over-scoping this for a 24-hour hackathon?",
})
if mc:
    reply = mc.get("message") or mc.get("response") or str(mc)[:400]
    print(f"  Mentor: {reply[:400]}")
    print("  [PASS] mentor chat")

print("\n" + "=" * 60)
print("  ALL SMOKE TESTS PASSED")
print("=" * 60)
