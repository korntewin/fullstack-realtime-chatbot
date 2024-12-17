import sys
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI
from sqlalchemy.future import select
from loguru import logger

from src.routers import llmdetails, registering, userdetails, llmchat
from src.models import LLM
from src.io.postgresql import get_session
from src.llmlib.tokenizer import get_tokenizer
from src import config

logger.remove()
logger.add(sys.stdout, level=config.LOG_LEVEL)


@asynccontextmanager
async def warm_tokenizer_cache(_: FastAPI):
    async for session in get_session():
        async with session.begin():
            result = await session.execute(select(LLM))
            llms = result.scalars().all()
    logger.info("llms found: ", llms)

    with ThreadPoolExecutor(5) as pool:
        list(pool.map(get_tokenizer, [llm.fullname for llm in llms]))
    logger.info("Finished warming tokenizer cache")

    yield


app = FastAPI(lifespan=warm_tokenizer_cache)

app.include_router(llmdetails.router)
app.include_router(userdetails.router)
app.include_router(llmchat.router)
app.include_router(registering.router)
