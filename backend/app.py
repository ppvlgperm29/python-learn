import json
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).parent
TOPICS_DIR = BASE_DIR / "data" / "topics"
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app = FastAPI(title="Python Learn API")


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
