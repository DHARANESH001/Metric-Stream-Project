from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ItemCreate(BaseModel):
    """Schema for creating a new inventory item."""

    name: str = Field(..., description="Unique or descriptive name of the item")
    initial_quantity: int = Field(
        default=0,
        ge=0,
        strict=True,
        description="Initial stock quantity, must be an integer >= 0",
    )
    low_stock_threshold: int = Field(
        default=0,
        ge=0,
        strict=True,
        description="Threshold at or below which item is flagged as low stock",
    )

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("Item name must not be empty or whitespace only.")
        return v.strip()

    @field_validator("initial_quantity", "low_stock_threshold", mode="before")
    @classmethod
    def reject_bool_and_fractions(cls, v: object) -> object:
        if isinstance(v, bool):
            raise ValueError("Value must be an integer, not a boolean.")
        if isinstance(v, float) and not v.is_integer():
            raise ValueError("Value must be an integer without fractions.")
        return v


class StockAdjustment(BaseModel):
    """Schema for increasing or decreasing stock quantity."""

    amount: Optional[int] = Field(
        default=None,
        gt=0,
        strict=True,
        description="Adjustment quantity, must be a strictly positive integer (> 0)",
    )
    quantity: Optional[int] = Field(
        default=None,
        gt=0,
        strict=True,
        description="Alternative alias for amount",
    )

    @field_validator("amount", "quantity", mode="before")
    @classmethod
    def reject_bool_and_fractions(cls, v: object) -> object:
        if v is not None:
            if isinstance(v, bool):
                raise ValueError("Adjustment quantity must be a positive integer, not a boolean.")
            if isinstance(v, float) and not v.is_integer():
                raise ValueError("Adjustment quantity must be an integer without fractions.")
        return v

    @model_validator(mode="after")
    def check_amount_provided(self) -> "StockAdjustment":
        # Resolve either amount or quantity
        if self.amount is None and self.quantity is not None:
            self.amount = self.quantity
        elif self.amount is None and self.quantity is None:
            raise ValueError("An adjustment amount (> 0) must be specified.")
        return self


class ItemResponse(BaseModel):
    """Schema for returning full inventory item details."""

    id: int
    name: str
    quantity: int
    low_stock_threshold: int
    is_low_stock: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StockAdjustmentResponse(BaseModel):
    """Schema returned after a successful increase/decrease operation."""

    id: int
    name: str
    quantity: int
    low_stock_threshold: int
    is_low_stock: bool
    adjustment: int
    action: str
    message: str

    model_config = ConfigDict(from_attributes=True)


class StockStatusResponse(BaseModel):
    """Schema for checking stock status and low-stock threshold alert."""

    item_id: int
    name: str
    quantity: int
    low_stock_threshold: int
    is_low_stock: bool
    status_message: str


class ErrorDetail(BaseModel):
    """Standardized error response schema."""

    detail: str
