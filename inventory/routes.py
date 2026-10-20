from typing import List
from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from inventory.database import get_db
from inventory.schemas import (
    ErrorDetail,
    ItemCreate,
    ItemResponse,
    StockAdjustment,
    StockAdjustmentResponse,
    StockStatusResponse,
)
from inventory.services import InventoryService

router = APIRouter(prefix="/items", tags=["Inventory Items"])


@router.post(
    "",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new inventory item",
    responses={
        400: {"model": ErrorDetail, "description": "Invalid input data"},
        422: {"description": "Validation error"},
    },
)
def create_item(
    item_in: ItemCreate,
    db: Session = Depends(get_db),
):
    """Create an inventory item with name, initial quantity, and low-stock threshold."""
    return InventoryService.create_item(db=db, item_in=item_in)


@router.get(
    "",
    response_model=List[ItemResponse],
    status_code=status.HTTP_200_OK,
    summary="List all inventory items",
)
def list_items(
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=100, ge=1, le=1000, description="Max items to return"),
    db: Session = Depends(get_db),
):
    """List all inventory items currently stored in the database."""
    return InventoryService.list_items(db=db, skip=skip, limit=limit)


@router.get(
    "/{item_id}",
    response_model=ItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Get one inventory item by ID",
    responses={
        404: {"model": ErrorDetail, "description": "Item not found"},
        422: {"description": "Invalid item ID format"},
    },
)
def get_item(
    item_id: int = Path(..., ge=1, description="Positive integer identifier of the inventory item"),
    db: Session = Depends(get_db),
):
    """Retrieve full details of an inventory item by its unique ID."""
    return InventoryService.get_item(db=db, item_id=item_id)


@router.post(
    "/{item_id}/increase",
    response_model=StockAdjustmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Increase stock quantity",
    responses={
        400: {"model": ErrorDetail, "description": "Invalid adjustment amount"},
        404: {"model": ErrorDetail, "description": "Item not found"},
        422: {"description": "Validation error"},
    },
)
def increase_stock(
    adjustment: StockAdjustment,
    item_id: int = Path(..., ge=1, description="Positive integer identifier of the inventory item"),
    db: Session = Depends(get_db),
):
    """Increase stock quantity for an item by a positive integer amount."""
    amount = adjustment.amount or adjustment.quantity or 0
    item, message = InventoryService.increase_stock(db=db, item_id=item_id, amount=amount)
    return StockAdjustmentResponse(
        id=item.id,
        name=item.name,
        quantity=item.quantity,
        low_stock_threshold=item.low_stock_threshold,
        is_low_stock=item.is_low_stock,
        adjustment=amount,
        action="increase",
        message=message,
    )


@router.post(
    "/{item_id}/decrease",
    response_model=StockAdjustmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Decrease stock quantity",
    responses={
        400: {"model": ErrorDetail, "description": "Negative stock violation or invalid amount"},
        404: {"model": ErrorDetail, "description": "Item not found"},
        422: {"description": "Validation error"},
    },
)
def decrease_stock(
    adjustment: StockAdjustment,
    item_id: int = Path(..., ge=1, description="Positive integer identifier of the inventory item"),
    db: Session = Depends(get_db),
):
    """Decrease stock quantity for an item. Rejects decreases that would make stock negative."""
    amount = adjustment.amount or adjustment.quantity or 0
    item, message = InventoryService.decrease_stock(db=db, item_id=item_id, amount=amount)
    return StockAdjustmentResponse(
        id=item.id,
        name=item.name,
        quantity=item.quantity,
        low_stock_threshold=item.low_stock_threshold,
        is_low_stock=item.is_low_stock,
        adjustment=amount,
        action="decrease",
        message=message,
    )


@router.get(
    "/{item_id}/stock-status",
    response_model=StockStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Check low-stock threshold status",
    responses={
        404: {"model": ErrorDetail, "description": "Item not found"},
        422: {"description": "Invalid item ID format"},
    },
)
def get_stock_status(
    item_id: int = Path(..., ge=1, description="Positive integer identifier of the inventory item"),
    db: Session = Depends(get_db),
):
    """Check whether an inventory item has reached or dropped below its low-stock threshold."""
    return InventoryService.get_stock_status(db=db, item_id=item_id)
