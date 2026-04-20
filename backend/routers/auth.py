from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models import LoginLog, User
from ..auth import hash_password, verify_password, create_access_token, get_current_user
from ..schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    user = User(
        username=body.username,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким email или именем уже существует",
        )
    return TokenResponse(
        access_token=create_access_token(user.id),
        username=user.username,
        user_id=user.id,
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else None)
    db.add(LoginLog(
        user_id=user.id,
        username=user.username,
        ip_address=ip,
        user_agent=request.headers.get("user-agent", "")[:500],
    ))
    db.commit()
    return TokenResponse(
        access_token=create_access_token(user.id),
        username=user.username,
        user_id=user.id,
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
