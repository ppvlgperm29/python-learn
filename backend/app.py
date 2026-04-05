import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .database import engine
from .models import Base
from .routers import auth, challenges, progress

BASE_DIR = Path(__file__).parent
TOPICS_DIR = BASE_DIR / "data" / "topics"
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app = FastAPI(title="Python Learn API")

# Create tables if they don't exist yet (Alembic handles migrations in prod)
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(challenges.router)
app.include_router(progress.router)


# ── Topics (still served from JSON) ─────────────────────
def load_topics_index():
    topics = []
    for path in sorted(TOPICS_DIR.glob("*.json")):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        topics.append({
            "id": data["id"],
            "slug": data["slug"],
            "title": data["title"],
            "description": data["description"],
            "order": data["order"],
            "task_count": len(data.get("tasks", [])),
        })
    return topics


def load_topic(slug: str):
    for path in sorted(TOPICS_DIR.glob("*.json")):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if data["slug"] == slug:
            return data
    return None


from fastapi import HTTPException


@app.get("/api/topics")
def get_topics():
    return load_topics_index()


@app.get("/api/topics/{slug}")
def get_topic(slug: str):
    topic = load_topic(slug)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")
