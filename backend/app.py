import json
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.gzip import GZIPMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .database import engine
from .models import Base
from .routers import admin, auth, challenges, progress

BASE_DIR = Path(__file__).parent
TOPICS_DIR = BASE_DIR / "data" / "topics"
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app = FastAPI(title="Python Learn API")
app.add_middleware(GZIPMiddleware, minimum_size=1000)

# Create tables if they don't exist yet (Alembic handles migrations in prod)
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(challenges.router)
app.include_router(progress.router)
app.include_router(admin.router)


# ── Topics (served from JSON with in-memory cache) ───────
_CACHE_TTL = 300.0  # seconds

_topics_index: list | None = None
_topics_index_ts: float = 0.0

_topic_by_slug: dict[str, tuple] = {}  # slug -> (data, timestamp)


def load_topics_index() -> list:
    global _topics_index, _topics_index_ts
    now = time.monotonic()
    if _topics_index is not None and (now - _topics_index_ts) < _CACHE_TTL:
        return _topics_index
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
    _topics_index = topics
    _topics_index_ts = now
    return topics


def load_topic(slug: str):
    now = time.monotonic()
    if slug in _topic_by_slug:
        cached_data, cached_ts = _topic_by_slug[slug]
        if (now - cached_ts) < _CACHE_TTL:
            return cached_data
    for path in sorted(TOPICS_DIR.glob("*.json")):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if data["slug"] == slug:
            _topic_by_slug[slug] = (data, now)
            return data
    return None


_CACHE_HEADER = {"Cache-Control": "public, max-age=3600"}


@app.get("/api/topics")
def get_topics():
    return JSONResponse(content=load_topics_index(), headers=_CACHE_HEADER)


@app.get("/api/topics/{slug}")
def get_topic(slug: str):
    topic = load_topic(slug)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return JSONResponse(content=topic, headers=_CACHE_HEADER)


app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")
