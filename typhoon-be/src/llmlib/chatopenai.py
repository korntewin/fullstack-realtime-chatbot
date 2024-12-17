from functools import lru_cache
from langchain_openai import ChatOpenAI

from src import config


@lru_cache(maxsize=128)
def get_llm(**params) -> ChatOpenAI:
    return ChatOpenAI(
        base_url=config.LLM_ENDPOINT,
        api_key=config.API_KEY,
        streaming=True,
        **params,
    )
