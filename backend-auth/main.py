"""PawSwap FastAPI backend — Auth, Users, Products, Search, etc."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, get_db
from models import User, PasswordResetToken
from routers import auth, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup."""
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup if needed


app = FastAPI(
    title="PawSwap API",
    description="Campus Resource Resale Platform — Northeastern University",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS: allow frontend at localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "PawSwap API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
