import datetime

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from loguru import logger

from src.io.postgresql import get_session
from src.models import (
    User,
    ChatSession,
    Message,
    RoleEnum,
    PreferenceEnum,
)
from src.llmlib.chatopenai import get_llm
from src import config


class Model(BaseModel):
    shortname: str
    fullname: str


class RegisterMessageRequest(BaseModel):
    email: str
    message: str
    tokens: int
    tokenSpeed: float
    role: RoleEnum
    session_id: int = None
    message_id: int = None
    model: Model


class RegisterUserRequest(BaseModel):
    email: str


class PreferenceRequest(BaseModel):
    message_id: int
    preference: PreferenceEnum


router = APIRouter()


async def comeup_with_sesion_name(
    shortname: str, user_msg: str, session_id: int, session: AsyncSession
):
    logger.info("Generating session name in background task")
    llm = get_llm(model=shortname)
    ans = await llm.ainvoke(
        [
            config.GET_SESSION_NAME_PROMPT,
            HumanMessage(content=f"{user_msg}\nช่วยคิดชื่อเท่ห์จากข้อความข้างต้นหน่อยนะครับ"),
        ]
    )

    async with session.begin():
        result = await session.execute(
            select(ChatSession).where(ChatSession.id == session_id)
        )
        chat_session = result.scalars().first()
        chat_session.updated_at = datetime.datetime.now(datetime.timezone.utc)
        chat_session.subject = ans.content
        await session.commit()

    logger.debug(f"Session name generated: {ans.content}")
    logger.info("Session name updated in database")


@router.post("/api/messages/register/v1")
async def register_message(
    request: RegisterMessageRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    logger.debug(f"Registering message: {request}")
    record_datetime = datetime.datetime.now(datetime.timezone.utc)
    async with session.begin():
        logger.debug("Fetching user")
        result = await session.execute(select(User).where(User.email == request.email))
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # If message_id is provided, fetch the message
        if request.message_id:
            logger.debug("Message ID provided, fetching message")
            result = await session.execute(
                select(Message).where(Message.id == request.message_id)
            )
            message = result.scalars().first()
            if not message:
                raise HTTPException(status_code=404, detail="Message not found")

            message.message = request.message
            message.total_tokens = request.tokens
            message.token_speed = str(request.tokenSpeed)
            message.updated_at = record_datetime

            await session.commit()

            return {
                "message": "Re-recorded message successfully",
                "session_id": message.chat_session_id,
                "message_id": message.id,
            }

        # If session_id is provided, fetch the chat session
        chat_session = None
        if request.session_id:
            logger.debug("Session ID provided, fetching chat session")
            result = await session.execute(
                select(ChatSession).where(
                    ChatSession.id == request.session_id, ChatSession.user_id == user.id
                )
            )
            chat_session = result.scalars().first()
            if not chat_session:
                raise HTTPException(status_code=404, detail="Chat session not found")

        # If session_id is not provided, create a new one
        if not chat_session:
            logger.debug("No session_id provided, creating a new session")

            chat_session = ChatSession(
                user_id=user.id,
                subject="New chat session",
                created_at=record_datetime,
                updated_at=record_datetime,
            )
            session.add(chat_session)
            await session.flush()  # Ensure the chat session ID is generated

            # Identify session subject using LLM and update the session name
            # in backgroun dtask
            background_tasks.add_task(
                comeup_with_sesion_name,
                request.model.shortname,
                request.message,
                chat_session.id,
                session,
            )

        # Create a new message
        new_message = Message(
            chat_session_id=chat_session.id,
            message=request.message,
            role=request.role,
            total_tokens=request.tokens,
            token_speed=str(request.tokenSpeed),
            created_at=record_datetime,
            updated_at=record_datetime,
        )
        session.add(new_message)
        await session.commit()

        return {
            "message": "Message registered successfully",
            "session_id": chat_session.id,
            "message_id": new_message.id,
        }


@router.post("/api/users/register/v1")
async def register_user(
    request: RegisterUserRequest,
    session: AsyncSession = Depends(get_session),
):
    logger.debug(f"Registering user: {request}")

    async with session.begin():
        result = await session.execute(select(User).where(User.email == request.email))
        existing_user = result.scalars().first()

        if existing_user:
            return {
                "message": "User already registered",
                "user_id": existing_user.id,
                "email": existing_user,
            }

        # Create new user
        new_user = User(
            email=request.email,
        )
        session.add(new_user)
        await session.commit()

        return {
            "message": "User registered successfully",
            "user_id": new_user.id,
            "email": new_user.email,
        }


@router.patch("/api/messages/preference/v1")
async def submit_preference(
    request: PreferenceRequest,
    session: AsyncSession = Depends(get_session),
):
    logger.debug(f"Submitting preference: {request}")

    async with session.begin():
        result = await session.execute(
            select(Message).where(Message.id == request.message_id)
        )
        message = result.scalars().first()
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")

        message.preference = request.preference
        await session.commit()

        return {
            "message": "Preference submitted successfully",
            "message_id": message.id,
        }
