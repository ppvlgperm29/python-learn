from pydantic import BaseModel, EmailStr, field_validator
from typing import Any, Optional
import re


# ── Auth ─────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_]{3,30}$", v):
            raise ValueError("Имя пользователя: 3–30 символов, только буквы, цифры и _")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Пароль должен содержать не менее 8 символов")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    user_id: int


class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True


# ── Challenges ───────────────────────────────────────────
class TestCaseSchema(BaseModel):
    args: list[Any]
    expected: Any
    label: Optional[str] = None

    class Config:
        from_attributes = True


class ChallengeSchema(BaseModel):
    id: int
    slug: str
    order: int
    difficulty: str
    category: str
    title: str
    description: str
    starter_code: str
    hint: Optional[str] = None
    solution: Optional[str] = None
    tests: list[TestCaseSchema] = []

    class Config:
        from_attributes = True


# ── Progress ─────────────────────────────────────────────
class ChallengeSolvedRequest(BaseModel):
    challenge_slug: str


class TopicProgressRequest(BaseModel):
    topic_slug: str
    solved_tasks: list[str]


class ProgressResponse(BaseModel):
    solved_challenges: list[str]
    topic_progress: dict[str, list[str]]


# ── Admin ─────────────────────────────────────────────────
class LoginLogResponse(BaseModel):
    id: int
    user_id: int
    username: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    logged_at: str

    class Config:
        from_attributes = True
