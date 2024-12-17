from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from src import config

# Create a sessionmaker for async sessions
engine = create_async_engine(
    config.DATABASE_URL,
    pool_size=config.POOL_SIZE,
    max_overflow=config.MAX_OVERFLOW,
    pool_timeout=config.POOL_TIMEOUT,
)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncSession:  # type: ignore
    async with async_session() as session:
        yield session
