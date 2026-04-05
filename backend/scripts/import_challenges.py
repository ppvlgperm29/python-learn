"""Import challenges from challenges.json into PostgreSQL.

Run from project root:
    python -m backend.scripts.import_challenges
"""
import json
import sys
from pathlib import Path

# Allow running from project root
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.database import SessionLocal, engine
from backend.models import Base, Challenge, TestCase


def main():
    data_file = Path(__file__).parent.parent / "data" / "challenges.json"
    with open(data_file, encoding="utf-8") as f:
        challenges = json.load(f)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    imported = 0
    skipped = 0

    for item in challenges:
        slug = item["id"]
        existing = db.query(Challenge).filter(Challenge.slug == slug).first()
        if existing:
            skipped += 1
            continue

        challenge = Challenge(
            slug=slug,
            order=item["order"],
            difficulty=item["difficulty"],
            category=item["category"],
            title=item["title"],
            description=item["description"],
            starter_code=item["starter_code"],
            hint=item.get("hint"),
        )
        db.add(challenge)
        db.flush()  # get challenge.id

        for test in item.get("tests", []):
            db.add(TestCase(
                challenge_id=challenge.id,
                args=test["args"],
                expected=test["expected"],
                label=test.get("label"),
            ))

        imported += 1

    db.commit()
    db.close()
    print(f"Done: {imported} imported, {skipped} skipped.")


if __name__ == "__main__":
    main()
