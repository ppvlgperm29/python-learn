from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models import User, ChallengeProgress, TopicProgress
from ..auth import get_current_user
from ..schemas import ChallengeSolvedRequest, TopicProgressRequest, ProgressResponse

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("", response_model=ProgressResponse)
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    solved = [r.challenge_slug for r in current_user.challenge_progress]
    topics = {r.topic_slug: r.solved_tasks for r in current_user.topic_progress}
    return ProgressResponse(solved_challenges=solved, topic_progress=topics)


@router.post("/challenge")
def mark_challenge_solved(
    body: ChallengeSolvedRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = ChallengeProgress(user_id=current_user.id, challenge_slug=body.challenge_slug)
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()  # already solved — not an error
    return {"ok": True}


@router.post("/topic")
def save_topic_progress(
    body: TopicProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(TopicProgress).filter_by(
        user_id=current_user.id, topic_slug=body.topic_slug
    ).first()
    if record:
        record.solved_tasks = body.solved_tasks
    else:
        record = TopicProgress(
            user_id=current_user.id,
            topic_slug=body.topic_slug,
            solved_tasks=body.solved_tasks,
        )
        db.add(record)
    db.commit()
    return {"ok": True}


@router.post("/sync")
def sync_progress(
    data: ProgressResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bulk sync from localStorage on first login."""
    # Challenges
    existing = {r.challenge_slug for r in current_user.challenge_progress}
    for slug in data.solved_challenges:
        if slug not in existing:
            db.add(ChallengeProgress(user_id=current_user.id, challenge_slug=slug))

    # Topics
    existing_topics = {r.topic_slug: r for r in current_user.topic_progress}
    for slug, tasks in data.topic_progress.items():
        if slug in existing_topics:
            existing_topics[slug].solved_tasks = list(
                set(existing_topics[slug].solved_tasks) | set(tasks)
            )
        else:
            db.add(TopicProgress(user_id=current_user.id, topic_slug=slug, solved_tasks=tasks))

    try:
        db.commit()
    except Exception:
        db.rollback()
    return {"ok": True}
