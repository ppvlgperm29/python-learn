from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Challenge
from ..schemas import ChallengeSchema, TestCaseSchema

router = APIRouter(prefix="/api/challenges", tags=["challenges"])


def _serialize(c: Challenge) -> dict:
    return {
        "id": c.id,
        "slug": c.slug,
        "order": c.order,
        "difficulty": c.difficulty,
        "category": c.category,
        "title": c.title,
        "description": c.description,
        "starter_code": c.starter_code,
        "hint": c.hint,
        "tests": [
            {"args": t.args, "expected": t.expected, "label": t.label}
            for t in c.test_cases
        ],
    }


@router.get("")
def get_challenges(db: Session = Depends(get_db)):
    challenges = db.query(Challenge).order_by(Challenge.order).all()
    return [_serialize(c) for c in challenges]


@router.get("/{slug}")
def get_challenge(slug: str, db: Session = Depends(get_db)):
    c = db.query(Challenge).filter(Challenge.slug == slug).first()
    if not c:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Challenge not found")
    return _serialize(c)
