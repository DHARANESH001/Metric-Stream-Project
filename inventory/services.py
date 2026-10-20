from datetime import datetime, timezone
from typing import List, Tuple
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from inventory.models import Item
from inventory.schemas import ItemCreate


class ItemNotFoundError(Exception):
    """Raised when an inventory item with the given ID cannot be found."""

    def __init__(self, item_id: int):
        self.item_id = item_id
        super().__init__(f"Inventory item with ID {item_id} not found.")


class InsufficientStockError(Exception):
    """Raised when decreasing stock would cause the quantity to drop below zero."""

    def __init__(self, current_quantity: int, requested_decrease: int):
        self.current_quantity = current_quantity
        self.requested_decrease = requested_decrease
        super().__init__(
            f"Cannot decrease stock by {requested_decrease}. Current stock is {current_quantity}. "
            "Stock must never drop below zero."
        )


class InvalidAdjustmentError(Exception):
    """Raised when adjustment quantity is not a positive integer."""

    def __init__(self, amount: object):
        self.amount = amount
        super().__init__(
            f"Adjustment quantity must be a positive integer greater than zero. Received: {amount}."
        )


class InventoryService:
    """Service handling business logic and transactions for inventory items."""

    @staticmethod
    def create_item(db: Session, item_in: ItemCreate) -> Item:
        """Create a new inventory item with validated parameters."""
        new_item = Item(
            name=item_in.name,
            quantity=item_in.initial_quantity,
            low_stock_threshold=item_in.low_stock_threshold,
        )
        try:
            db.add(new_item)
            db.commit()
            db.refresh(new_item)
            return new_item
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def list_items(db: Session, skip: int = 0, limit: int = 100) -> List[Item]:
        """List inventory items with pagination."""
        stmt = select(Item).offset(skip).limit(limit).order_by(Item.id)
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_item(db: Session, item_id: int) -> Item:
        """Retrieve an item by ID or raise ItemNotFoundError."""
        item = db.get(Item, item_id)
        if item is None:
            raise ItemNotFoundError(item_id)
        return item

    @staticmethod
    def increase_stock(db: Session, item_id: int, amount: int) -> Tuple[Item, str]:
        """Increase stock quantity for an item atomically."""
        if isinstance(amount, bool) or not isinstance(amount, int) or amount <= 0:
            raise InvalidAdjustmentError(amount)

        now = datetime.now(timezone.utc)
        try:
            stmt = (
                update(Item)
                .where(Item.id == item_id)
                .values(
                    quantity=Item.quantity + amount,
                    updated_at=now,
                )
            )
            result = db.execute(stmt)
            if result.rowcount == 0:
                raise ItemNotFoundError(item_id)

            db.commit()
            item = InventoryService.get_item(db, item_id)
        except Exception:
            db.rollback()
            raise

        status_note = " (Low stock threshold reached!)" if item.is_low_stock else ""
        msg = f"Stock increased by {amount}. New quantity: {item.quantity}.{status_note}"
        return item, msg

    @staticmethod
    def decrease_stock(db: Session, item_id: int, amount: int) -> Tuple[Item, str]:
        """Decrease stock quantity for an item atomically, strictly rejecting negative stock."""
        if isinstance(amount, bool) or not isinstance(amount, int) or amount <= 0:
            raise InvalidAdjustmentError(amount)

        now = datetime.now(timezone.utc)
        try:
            stmt = (
                update(Item)
                .where(Item.id == item_id, Item.quantity >= amount)
                .values(
                    quantity=Item.quantity - amount,
                    updated_at=now,
                )
            )
            result = db.execute(stmt)
            if result.rowcount == 0:
                # Differentiate between non-existent item and insufficient stock
                item = db.get(Item, item_id)
                if item is None:
                    raise ItemNotFoundError(item_id)
                raise InsufficientStockError(item.quantity, amount)

            db.commit()
            item = InventoryService.get_item(db, item_id)
        except Exception:
            db.rollback()
            raise

        status_note = " (Low stock threshold reached!)" if item.is_low_stock else ""
        msg = f"Stock decreased by {amount}. New quantity: {item.quantity}.{status_note}"
        return item, msg

    @staticmethod
    def get_stock_status(db: Session, item_id: int) -> dict:
        """Check the low-stock status of an item."""
        item = InventoryService.get_item(db, item_id)
        is_low = item.is_low_stock
        if is_low:
            message = (
                f"Item '{item.name}' is low on stock! Current quantity ({item.quantity}) "
                f"is at or below threshold ({item.low_stock_threshold})."
            )
        else:
            message = (
                f"Item '{item.name}' has sufficient stock ({item.quantity} > "
                f"threshold {item.low_stock_threshold})."
            )

        return {
            "item_id": item.id,
            "name": item.name,
            "quantity": item.quantity,
            "low_stock_threshold": item.low_stock_threshold,
            "is_low_stock": is_low,
            "status_message": message,
        }
