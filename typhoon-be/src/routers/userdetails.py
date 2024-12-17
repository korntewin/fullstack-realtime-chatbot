from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.io.postgresql import get_session
from src.models import User, ChatSession, ChatSessionSchema, Message, MessageSchema

router = APIRouter()


@router.get(
    "/api/users/{email}/chat_sessions/v1", response_model=list[ChatSessionSchema]
)
async def get_user_chat_sessions(
    email: str, session: AsyncSession = Depends(get_session)
):
    async with session.begin():
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user:
            # First time register will not have any chat sessions
            return []

        result = await session.execute(
            select(ChatSession).where(ChatSession.user_id == user.id)
        )
        chat_sessions = result.scalars().all()
        return chat_sessions


@router.get(
    "/api/chat_sessions/{session_id}/messages/v1", response_model=list[MessageSchema]
)
async def get_chat_session_messages(
    session_id: int, session: AsyncSession = Depends(get_session)
):
    async with session.begin():
        result = await session.execute(
            select(Message).where(Message.chat_session_id == session_id)
        )
        messages = result.scalars().all()
        return messages
