import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from inventory.database import init_db
from inventory.routes import router as items_router
from inventory.services import (
    InsufficientStockError,
    InvalidAdjustmentError,
    ItemNotFoundError,
)

logger = logging.getLogger("inventory")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event to initialize database schema on startup."""
    init_db()
    yield


def create_app() -> FastAPI:
    """Application factory for Inventory Counter API."""
    app = FastAPI(
        title="Inventory Counter API",
        description=(
            "A lightweight local REST API to manage inventory items, adjust stock counts, "
            "and track low-stock thresholds."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    # Enable CORS for local frontend development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register custom domain exception handlers
    @app.exception_handler(ItemNotFoundError)
    async def item_not_found_handler(request: Request, exc: ItemNotFoundError):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc)},
        )

    @app.exception_handler(InsufficientStockError)
    async def insufficient_stock_handler(request: Request, exc: InsufficientStockError):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(exc)},
        )

    @app.exception_handler(InvalidAdjustmentError)
    async def invalid_adjustment_handler(request: Request, exc: InvalidAdjustmentError):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(exc)},
        )

    # Sanitize any unexpected internal server errors
    @app.exception_handler(Exception)
    async def global_unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(
            "Unhandled server error on %s %s: %s", request.method, request.url.path, exc, exc_info=True
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred."},
        )

    # Root informational endpoint
    @app.get("/", tags=["Health"])
    def root():
        return {
            "service": "Inventory Counter API",
            "version": "0.1.0",
            "status": "healthy",
            "documentation": "/docs",
        }

    # Include item routes
    app.include_router(items_router)

    return app


app = create_app()
