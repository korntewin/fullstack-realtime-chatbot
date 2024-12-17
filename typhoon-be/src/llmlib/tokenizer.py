from functools import cache

from transformers import AutoTokenizer

from loguru import logger


@cache
def get_tokenizer(model_name: str) -> AutoTokenizer | None:
    logger.debug(f"Getting tokenizer for model: {model_name}")
    return AutoTokenizer.from_pretrained(model_name)
