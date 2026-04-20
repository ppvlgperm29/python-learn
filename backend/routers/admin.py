import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import LoginLog
from ..auth import get_current_user
from ..models import User
from ..schemas import LoginLogResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "gamendstr@gmail.com")


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.email.lower() != ADMIN_EMAIL.lower():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")
    return current_user


@router.get("/logins", response_model=list[LoginLogResponse])
def get_logins(
    limit: int = 200,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    logs = (
        db.query(LoginLog)
        .order_by(LoginLog.logged_at.desc())
        .limit(limit)
        .all()
    )
    return [
        LoginLogResponse(
            id=log.id,
            user_id=log.user_id,
            username=log.username,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            logged_at=log.logged_at.strftime("%d.%m.%Y %H:%M:%S"),
        )
        for log in logs
    ]
