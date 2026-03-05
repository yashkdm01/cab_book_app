from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from dotenv import load_dotenv
import os
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL") 
if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL not found. Ensure your .env file is in the 'backend' folder "
        "and contains: DATABASE_URL=postgresql+psycopg://..."
    )

engine = create_engine(DATABASE_URL, echo=True)

async_engine = create_async_engine(DATABASE_URL, echo=True)

async_session = async_sessionmaker(async_engine, expire_on_commit=False)

def get_session():
    with Session(engine) as session:
        yield session

async def get_async_session():
    async with async_session() as session:
        yield session