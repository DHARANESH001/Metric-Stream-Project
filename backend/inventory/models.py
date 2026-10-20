from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from inventory.database import Base


class Item(Base):
    """SQLAlchemy model representing an inventory item."""

    __tablename__ = "items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    @property
    def is_low_stock(self) -> bool:
        """Item is considered low stock if current quantity <= low-stock threshold."""
        return self.quantity <= self.low_stock_threshold

    def __repr__(self) -> str:
        return (
            f"<Item id={self.id} name='{self.name}' quantity={self.quantity} "
            f"threshold={self.low_stock_threshold}>"
        )
