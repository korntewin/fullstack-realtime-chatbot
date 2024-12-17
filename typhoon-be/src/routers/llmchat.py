import time
import re
import json
from typing import Any

from loguru import logger
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from langchain.schema import HumanMessage, AIMessage
from pydantic import BaseModel, field_validator

from src.llmlib.tokenizer import get_tokenizer
from src.llmlib.chatopenai import get_llm
from src import config


def camel_to_snake(name):
    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


class Message(BaseModel):
    role: str
    content: str


class ModelName(BaseModel):
    fullname: str
    shortname: str


class ChatRequest(BaseModel):
    messages: list[Message]
    model: ModelName
    params: dict[str, Any] = {}

    @field_validator("params")
    @classmethod
    def convert_params_keys_to_snake_case(cls, v):
        if isinstance(v, dict):
            v = {camel_to_snake(key): val for key, val in v.items()}

            # intercept output length to be max_tokens to be consistent with OpenAI API
            # remove top_k as it doesn't seem to be supported by OpenAI API
            v = {
                key if key != "output_length" else "max_tokens": val
                for key, val in v.items()
                if key not in ("top_k", "repetition_penalty")
            }
        return v


router = APIRouter()


@router.post("/api/llm/sessionname/v1")
async def llm_session_name(request: ChatRequest):
    messages = request.messages
    messages = [
        HumanMessage(content=msg.content)
        if msg.role == "user"
        else AIMessage(content=msg.content)
        for msg in messages
    ]
    params = request.params

    chat = get_llm(**params, model=request.model.shortname)
    session_name = await chat.ainvoke([config.GET_SESSION_NAME_PROMPT, *messages])

    return session_name.content


@router.post("/api/llm/chat/v1")
async def llm_chat(request: ChatRequest):
    messages = request.messages
    messages = [
        HumanMessage(content=msg.content)
        if msg.role == "user"
        else AIMessage(content=msg.content)
        for msg in messages
    ]
    params = request.params
    logger.debug(f"Message: {messages}")
    logger.debug(f"Params: {params}")
    logger.debug(f"Model: {request.model}")

    tokenizer = get_tokenizer(request.model.fullname)
    chat = get_llm(**params, model=request.model.shortname)

    async def event_generator():
        total_tokens = 0
        start_time = time.time()

        async for chunk in chat.astream([config.GENERAL_PROMPT, *messages]):
            token_count = 0
            if tokenizer:
                token_count = len(tokenizer.tokenize(chunk.content))
            total_tokens += token_count
            elapsed_time = time.time() - start_time
            token_speed = total_tokens / elapsed_time if elapsed_time > 0 else 0

            payload = {
                "content": chunk.content,
                "tokens": total_tokens,
                "tokenSpeed": token_speed,
            }
            logger.debug(payload)
            yield json.dumps(payload)

        yield "done"

    return EventSourceResponse(event_generator())


if __name__ == "__main__":
    # pylint: disable=redefined-outer-name
    import asyncio

    llm = get_llm(model="typhoon-v1.5x-70b-instruct")
    tokenizer_test = get_tokenizer(model_name="typhoon-v1.5x-70b-instruct")
    result = llm.invoke([HumanMessage(content="Hello, how are you?")])
    print(result)

    async def test_run_llm():
        async for chunk in llm.astream([HumanMessage(content="Hello, how are you?")]):
            print(tokenizer_test.tokenize(chunk.content))
            print(chunk)

    asyncio.run(test_run_llm())
