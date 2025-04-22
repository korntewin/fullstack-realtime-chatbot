# pylint: disable=line-too-long
import os

from langchain_core.messages import SystemMessage
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
POOL_SIZE = int(os.getenv("POOL_SIZE", "50"))
MAX_OVERFLOW = int(os.getenv("MAX_OVERFLOW", "10"))
POOL_TIMEOUT = int(os.getenv("POOL_TIMEOUT", "30"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG")

# LLM
LLM_ENDPOINT = os.getenv("LLM_ENDPOINT")
API_KEY = os.getenv("API_KEY")
TYPHOON_MODELS_NAME_IN_HF = [
    "scb10x/llama-3-typhoon-v1.5x-70b-instruct",
    "scb10x/llama-3-typhoon-v1.5",
]

# System Prompt
GET_SESSION_NAME_PROMPT = SystemMessage(
    content="สรุปเนื้อหาของข้อความที่ได้รับ ให้เป็นหัวข้อของการสนทนาสั้นกระชับ ไม่เกิน 5 คำ",
)

GENERAL_PROMPT = SystemMessage(
    content="ตอบข้อความจากบทสนทนาที่ได้รับ โดยให้ตอบเป็นภาษาไทยหรืออังกฤษขึ้นอยู่กับภาษาที่ผู้ใช้งานถาม",
)
