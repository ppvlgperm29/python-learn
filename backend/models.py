from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    challenge_progress = relationship("ChallengeProgress", back_populates="user")
    topic_progress = relationship("TopicProgress", back_populates="user")


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    order = Column(Integer, nullable=False)
    difficulty = Column(String(10), nullable=False)
    category = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    starter_code = Column(Text, nullable=False)
    hint = Column(Text, nullable=True)

    test_cases = relationship("TestCase", back_populates="challenge", order_by="TestCase.id")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    args = Column(JSON, nullable=False)
    expected = Column(JSON, nullable=False)
    label = Column(String(255), nullable=True)

    challenge = relationship("Challenge", back_populates="test_cases")


class ChallengeProgress(Base):
    __tablename__ = "challenge_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge_slug = Column(String(100), nullable=False)
    solved_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="challenge_progress")

    __table_args__ = (UniqueConstraint("user_id", "challenge_slug"),)


class TopicProgress(Base):
    __tablename__ = "topic_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_slug = Column(String(100), nullable=False)
    solved_tasks = Column(JSON, nullable=False, default=list)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="topic_progress")

    __table_args__ = (UniqueConstraint("user_id", "topic_slug"),)
