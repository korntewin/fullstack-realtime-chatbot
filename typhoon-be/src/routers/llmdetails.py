from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from loguru import logger

from src.io.postgresql import get_session
from src.models import LLM, LLMSchema


router = APIRouter()


@router.get("/api/llm/params/v1", response_model=list[LLMSchema])
async def get_llms(session: AsyncSession = Depends(get_session)):
    async with session.begin():
        result = await session.execute(select(LLM))
        llms = result.scalars().all()
        logger.debug("llms found: ", llms)

        if not llms:
            raise HTTPException(status_code=404, detail="No LLMs found")
        return llms
