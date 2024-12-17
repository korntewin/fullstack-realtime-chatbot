import enum
import datetime

from sqlalchemy.types import Enum
from sqlalchemy import Column, DateTime, Text, Integer, ForeignKey, JSON, DECIMAL
from sqlalchemy.orm import DeclarativeBase
from pydantic import BaseModel


def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(Text, unique=True)
    full_name = Column(Text)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
    )


class UserSchema(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(Text)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
    )


class ChatSessionSchema(BaseModel):
    id: int
    user_id: int
    subject: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True


class RoleEnum(enum.Enum):
    USER = "user"
    BOT = "bot"


class PreferenceEnum(enum.Enum):
    LIKE = "like"
    DISLIKE = "dislike"
    NA = "na"


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    chat_session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    message = Column(Text)
    role = Column(Enum(RoleEnum))
    total_tokens = Column(Integer)
    token_speed = Column(DECIMAL(10, 2))
    preference = Column(Enum(PreferenceEnum), default=PreferenceEnum.NA)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
    )


class MessageSchema(BaseModel):
    id: int
    chat_session_id: int
    message: str
    role: RoleEnum
    total_tokens: int
    token_speed: float
    preference: PreferenceEnum
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True


class LLM(Base):
    __tablename__ = "llms"
    id = Column(Integer, primary_key=True)
    shortname = Column(Text)
    fullname = Column(Text)
    params = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(
        DateTime(timezone=True),
        default=get_utc_now,
        onupdate=get_utc_now,
    )


class LLMSchema(BaseModel):
    id: int
    shortname: str
    fullname: str
    params: dict
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True
