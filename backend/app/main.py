"""
Money Muling Detection Engine — FastAPI Application

Entrypoint: uvicorn backend.app.main:app --reload
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import init_db
from backend.app.routes.sessions import router as sessions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle events."""
    # Startup: create all DB tables
    init_db()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="Money Muling Detection Engine",
    description="Graph-based financial crime detection API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(sessions_router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
