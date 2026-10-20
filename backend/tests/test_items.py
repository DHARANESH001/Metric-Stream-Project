import concurrent.futures
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from inventory.database import Base
from inventory.models import Item
from inventory.schemas import ItemCreate
from inventory.services import (
    InsufficientStockError,
    InvalidAdjustmentError,
    InventoryService,
    ItemNotFoundError,
)


# ============================================================================
# Root / Health Check Tests
# ============================================================================

def test_root_endpoint(client: TestClient):
    """Test root health/info endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Inventory Counter API" in data["service"]


# ============================================================================
# POST /items - Create Item Tests
# ============================================================================

def test_create_item_success(client: TestClient):
    """Test creating an item with valid parameters."""
    payload = {
        "name": "Widget A",
        "initial_quantity": 25,
        "low_stock_threshold": 10,
    }
    response = client.post("/items", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["name"] == "Widget A"
    assert data["quantity"] == 25
    assert data["low_stock_threshold"] == 10
    assert data["is_low_stock"] is False
    assert "created_at" in data
    assert "updated_at" in data


def test_create_item_initially_low_stock(client: TestClient):
    """Test creating an item whose initial quantity is below or equal to threshold."""
    payload = {
        "name": "Widget Low",
        "initial_quantity": 3,
        "low_stock_threshold": 5,
    }
    response = client.post("/items", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["quantity"] == 3
    assert data["low_stock_threshold"] == 5
    assert data["is_low_stock"] is True


def test_create_item_default_quantities(client: TestClient):
    """Test creating an item with default quantity (0) and threshold (0)."""
    payload = {"name": "Blank Widget"}
    response = client.post("/items", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["quantity"] == 0
    assert data["low_stock_threshold"] == 0
    # 0 <= 0 is True, so is_low_stock is True
    assert data["is_low_stock"] is True


def test_create_item_missing_name(client: TestClient):
    """Test creating an item without a name field."""
    response = client.post("/items", json={"initial_quantity": 10, "low_stock_threshold": 2})
    assert response.status_code == 422


def test_create_item_rejects_empty_name(client: TestClient):
    """Test that creating an item with an empty or whitespace name fails validation."""
    response = client.post("/items", json={"name": "", "initial_quantity": 10})
    assert response.status_code == 422

    response_ws = client.post("/items", json={"name": "   ", "initial_quantity": 10})
    assert response_ws.status_code == 422


def test_create_item_rejects_negative_initial_quantity(client: TestClient):
    """Test that creating an item with negative initial quantity is rejected."""
    payload = {
        "name": "Bad Widget",
        "initial_quantity": -5,
        "low_stock_threshold": 2,
    }
    response = client.post("/items", json=payload)
    assert response.status_code == 422


def test_create_item_rejects_negative_threshold(client: TestClient):
    """Test that creating an item with negative low-stock threshold is rejected."""
    payload = {
        "name": "Bad Widget",
        "initial_quantity": 5,
        "low_stock_threshold": -1,
    }
    response = client.post("/items", json=payload)
    assert response.status_code == 422


def test_create_item_rejects_booleans_and_fractions(client: TestClient):
    """Test that booleans and fractional values are rejected for initial_quantity and threshold."""
    # Boolean initial_quantity
    res_bool_qty = client.post("/items", json={"name": "W1", "initial_quantity": True})
    assert res_bool_qty.status_code == 422

    # Boolean threshold
    res_bool_thr = client.post("/items", json={"name": "W2", "low_stock_threshold": False})
    assert res_bool_thr.status_code == 422

    # Fractional initial_quantity
    res_float_qty = client.post("/items", json={"name": "W3", "initial_quantity": 10.5})
    assert res_float_qty.status_code == 422

    # Fractional threshold
    res_float_thr = client.post("/items", json={"name": "W4", "low_stock_threshold": 2.5})
    assert res_float_thr.status_code == 422

    # String type for integer
    res_str_qty = client.post("/items", json={"name": "W5", "initial_quantity": "invalid"})
    assert res_str_qty.status_code == 422


# ============================================================================
# GET /items - List Items Tests
# ============================================================================

def test_list_items_empty(client: TestClient):
    """Test listing items when the database is empty."""
    response = client.get("/items")
    assert response.status_code == 200
    assert response.json() == []


def test_list_items_one_item(client: TestClient):
    """Test listing single item in database."""
    client.post("/items", json={"name": "Solo Item", "initial_quantity": 5, "low_stock_threshold": 2})
    response = client.get("/items")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 1
    assert items[0]["name"] == "Solo Item"
    assert items[0]["quantity"] == 5


def test_list_items_populated(client: TestClient):
    """Test listing items returns all created items."""
    client.post("/items", json={"name": "Item 1", "initial_quantity": 10, "low_stock_threshold": 5})
    client.post("/items", json={"name": "Item 2", "initial_quantity": 20, "low_stock_threshold": 15})

    response = client.get("/items")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    assert items[0]["name"] == "Item 1"
    assert items[1]["name"] == "Item 2"


def test_list_items_pagination(client: TestClient):
    """Test listing items with pagination (skip, limit)."""
    for i in range(5):
        client.post("/items", json={"name": f"Item {i}", "initial_quantity": i, "low_stock_threshold": 2})

    response = client.get("/items?skip=1&limit=2")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    assert items[0]["name"] == "Item 1"
    assert items[1]["name"] == "Item 2"


# ============================================================================
# GET /items/{item_id} - Get Item by ID Tests
# ============================================================================

def test_get_item_by_id_success(client: TestClient):
    """Test retrieving an existing item by ID."""
    created = client.post(
        "/items", json={"name": "Hammer", "initial_quantity": 50, "low_stock_threshold": 10}
    ).json()

    response = client.get(f"/items/{created['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created["id"]
    assert data["name"] == "Hammer"
    assert data["quantity"] == 50


def test_get_item_by_id_not_found(client: TestClient):
    """Test retrieving a non-existent item returns 404."""
    response = client.get("/items/999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_item_by_id_invalid_formats(client: TestClient):
    """Test retrieving with invalid item ID formats returns 422."""
    res_str = client.get("/items/abc")
    assert res_str.status_code == 422

    res_zero = client.get("/items/0")
    assert res_zero.status_code == 422

    res_neg = client.get("/items/-5")
    assert res_neg.status_code == 422


# ============================================================================
# POST /items/{item_id}/increase - Increase Stock Tests
# ============================================================================

def test_increase_stock_success(client: TestClient):
    """Test increasing stock with a positive integer amount."""
    created = client.post(
        "/items", json={"name": "Nails", "initial_quantity": 10, "low_stock_threshold": 15}
    ).json()
    assert created["is_low_stock"] is True

    response = client.post(f"/items/{created['id']}/increase", json={"amount": 10})
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 20
    assert data["is_low_stock"] is False
    assert data["action"] == "increase"
    assert data["adjustment"] == 10
    assert "Stock increased by 10" in data["message"]


def test_increase_stock_by_one(client: TestClient):
    """Test increasing stock by exactly 1."""
    created = client.post("/items", json={"name": "Tape", "initial_quantity": 5}).json()
    response = client.post(f"/items/{created['id']}/increase", json={"amount": 1})
    assert response.status_code == 200
    assert response.json()["quantity"] == 6


def test_increase_stock_with_quantity_alias(client: TestClient):
    """Test increasing stock using 'quantity' field alias."""
    created = client.post(
        "/items", json={"name": "Screws", "initial_quantity": 5, "low_stock_threshold": 2}
    ).json()

    response = client.post(f"/items/{created['id']}/increase", json={"quantity": 7})
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 12


def test_increase_stock_rejects_zero_and_negative(client: TestClient):
    """Test that increase rejects 0 or negative adjustment."""
    created = client.post("/items", json={"name": "Bolts", "initial_quantity": 5}).json()

    # Zero amount
    res_zero = client.post(f"/items/{created['id']}/increase", json={"amount": 0})
    assert res_zero.status_code == 422

    # Negative amount
    res_neg = client.post(f"/items/{created['id']}/increase", json={"amount": -5})
    assert res_neg.status_code == 422


def test_increase_stock_rejects_booleans_fractions_and_missing(client: TestClient):
    """Test that increase rejects booleans, floats, strings, and empty payloads."""
    created = client.post("/items", json={"name": "Washers", "initial_quantity": 5}).json()

    # Boolean
    res_bool = client.post(f"/items/{created['id']}/increase", json={"amount": True})
    assert res_bool.status_code == 422

    # Float with fraction
    res_float = client.post(f"/items/{created['id']}/increase", json={"amount": 2.5})
    assert res_float.status_code == 422

    # String
    res_str = client.post(f"/items/{created['id']}/increase", json={"amount": "five"})
    assert res_str.status_code == 422

    # Empty body
    res_empty = client.post(f"/items/{created['id']}/increase", json={})
    assert res_empty.status_code == 422


def test_increase_stock_not_found(client: TestClient):
    """Test increasing stock for non-existent item returns 404."""
    response = client.post("/items/999/increase", json={"amount": 5})
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# ============================================================================
# POST /items/{item_id}/decrease - Decrease Stock Tests
# ============================================================================

def test_decrease_stock_success(client: TestClient):
    """Test decreasing stock with valid amount."""
    created = client.post(
        "/items", json={"name": "Drills", "initial_quantity": 10, "low_stock_threshold": 5}
    ).json()

    response = client.post(f"/items/{created['id']}/decrease", json={"amount": 4})
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 6
    assert data["is_low_stock"] is False
    assert data["action"] == "decrease"
    assert data["adjustment"] == 4


def test_decrease_stock_to_low_stock(client: TestClient):
    """Test decreasing stock below or equal to threshold updates is_low_stock flag."""
    created = client.post(
        "/items", json={"name": "Drills", "initial_quantity": 10, "low_stock_threshold": 5}
    ).json()

    response = client.post(f"/items/{created['id']}/decrease", json={"amount": 6})
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 4
    assert data["is_low_stock"] is True
    assert "Low stock threshold reached" in data["message"]


def test_decrease_stock_to_exact_zero(client: TestClient):
    """Test decreasing stock to exactly zero is allowed."""
    created = client.post(
        "/items", json={"name": "Tape", "initial_quantity": 5, "low_stock_threshold": 2}
    ).json()

    response = client.post(f"/items/{created['id']}/decrease", json={"amount": 5})
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 0
    assert data["is_low_stock"] is True


def test_decrease_stock_rejects_negative_stock(client: TestClient):
    """Test that stock decrease exceeding current quantity is strictly rejected."""
    created = client.post(
        "/items", json={"name": "Tape", "initial_quantity": 5, "low_stock_threshold": 2}
    ).json()

    response = client.post(f"/items/{created['id']}/decrease", json={"amount": 6})
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Stock must never drop below zero" in data["detail"]

    # Verify stock remained unchanged in DB
    verify = client.get(f"/items/{created['id']}").json()
    assert verify["quantity"] == 5


def test_decrease_stock_rejects_booleans_fractions_and_missing(client: TestClient):
    """Test that decrease rejects booleans, floats, strings, and empty payloads."""
    created = client.post("/items", json={"name": "Pencils", "initial_quantity": 10}).json()

    # Boolean
    res_bool = client.post(f"/items/{created['id']}/decrease", json={"amount": True})
    assert res_bool.status_code == 422

    # Float with fraction
    res_float = client.post(f"/items/{created['id']}/decrease", json={"amount": 3.5})
    assert res_float.status_code == 422

    # String
    res_str = client.post(f"/items/{created['id']}/decrease", json={"amount": "three"})
    assert res_str.status_code == 422

    # Empty payload
    res_empty = client.post(f"/items/{created['id']}/decrease", json={})
    assert res_empty.status_code == 422


def test_decrease_stock_rejects_zero_and_negative_amount(client: TestClient):
    """Test that decrease rejects non-positive adjustment amounts."""
    created = client.post("/items", json={"name": "Glue", "initial_quantity": 10}).json()

    res_zero = client.post(f"/items/{created['id']}/decrease", json={"amount": 0})
    assert res_zero.status_code == 422

    res_neg = client.post(f"/items/{created['id']}/decrease", json={"amount": -2})
    assert res_neg.status_code == 422


def test_decrease_stock_not_found(client: TestClient):
    """Test decreasing stock for non-existent item returns 404."""
    response = client.post("/items/999/decrease", json={"amount": 2})
    assert response.status_code == 404


# ============================================================================
# GET /items/{item_id}/stock-status - Check Low-Stock Status Tests
# ============================================================================

def test_stock_status_normal(client: TestClient):
    """Test stock status when quantity > threshold."""
    created = client.post(
        "/items", json={"name": "Paint", "initial_quantity": 20, "low_stock_threshold": 5}
    ).json()

    response = client.get(f"/items/{created['id']}/stock-status")
    assert response.status_code == 200
    data = response.json()
    assert data["item_id"] == created["id"]
    assert data["name"] == "Paint"
    assert data["quantity"] == 20
    assert data["low_stock_threshold"] == 5
    assert data["is_low_stock"] is False
    assert "sufficient stock" in data["status_message"]


def test_stock_status_low_threshold_scenarios(client: TestClient):
    """Test all boundary scenarios for low-stock threshold rule."""
    # 1. Quantity strictly equal to threshold -> is_low_stock is True
    eq_item = client.post("/items", json={"name": "Eq", "initial_quantity": 5, "low_stock_threshold": 5}).json()
    res_eq = client.get(f"/items/{eq_item['id']}/stock-status").json()
    assert res_eq["is_low_stock"] is True

    # 2. Quantity strictly below threshold -> is_low_stock is True
    low_item = client.post("/items", json={"name": "Low", "initial_quantity": 4, "low_stock_threshold": 5}).json()
    res_low = client.get(f"/items/{low_item['id']}/stock-status").json()
    assert res_low["is_low_stock"] is True

    # 3. Quantity zero with positive threshold -> is_low_stock is True
    zero_pos = client.post("/items", json={"name": "ZeroPos", "initial_quantity": 0, "low_stock_threshold": 5}).json()
    res_zero_pos = client.get(f"/items/{zero_pos['id']}/stock-status").json()
    assert res_zero_pos["is_low_stock"] is True

    # 4. Quantity zero with zero threshold (0 <= 0) -> is_low_stock is True
    zero_zero = client.post("/items", json={"name": "ZeroZero", "initial_quantity": 0, "low_stock_threshold": 0}).json()
    res_zero_zero = client.get(f"/items/{zero_zero['id']}/stock-status").json()
    assert res_zero_zero["is_low_stock"] is True


def test_stock_status_not_found(client: TestClient):
    """Test stock status for non-existent item returns 404."""
    response = client.get("/items/999/stock-status")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# ============================================================================
# Persistence Across Database Sessions & Concurrency Tests
# ============================================================================

def test_database_persistence_across_sessions(tmp_path):
    """Verify that records persist correctly across separate database sessions."""
    db_file = tmp_path / "persistence_test.db"
    db_url = f"sqlite:///{db_file}"

    # Session 1: Create table and insert item
    engine1 = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine1)
    Session1 = sessionmaker(bind=engine1)
    with Session1() as session1:
        InventoryService.create_item(
            session1, ItemCreate(name="Persist Item", initial_quantity=40, low_stock_threshold=15)
        )
    engine1.dispose()

    # Session 2: Connect with new engine/session and read item
    engine2 = create_engine(db_url, connect_args={"check_same_thread": False})
    Session2 = sessionmaker(bind=engine2)
    with Session2() as session2:
        item = InventoryService.get_item(session2, 1)
        assert item.name == "Persist Item"
        assert item.quantity == 40
        assert item.low_stock_threshold == 15
        assert item.is_low_stock is False
    engine2.dispose()


def test_concurrent_stock_decreases_prevent_negative_stock(tmp_path):
    """
    Test concurrency: Multiple threads simultaneously attempt to decrease stock.
    Stock must never become negative.
    """
    db_file = tmp_path / "concurrency_test.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_engine(db_url, connect_args={"check_same_thread": False, "timeout": 30})
    Base.metadata.create_all(bind=engine)
    SessionFactory = sessionmaker(bind=engine)

    # Initial item with 10 units
    with SessionFactory() as session:
        item = InventoryService.create_item(
            session, ItemCreate(name="Thread Item", initial_quantity=10, low_stock_threshold=2)
        )
        item_id = item.id

    success_count = 0
    failure_count = 0

    def attempt_decrease():
        with SessionFactory() as session:
            try:
                InventoryService.decrease_stock(session, item_id, 2)
                return True
            except InsufficientStockError:
                return False

    # 10 threads trying to decrease 2 units each (total demand 20, available 10)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(attempt_decrease) for _ in range(10)]
        for f in concurrent.futures.as_completed(futures):
            if f.result():
                success_count += 1
            else:
                failure_count += 1

    # Exactly 5 should succeed (5 * 2 = 10 units), 5 must fail
    assert success_count == 5
    assert failure_count == 5

    # Verify final quantity in DB is exactly 0 and never dropped below 0
    with SessionFactory() as session:
        final_item = InventoryService.get_item(session, item_id)
        assert final_item.quantity == 0
        assert final_item.is_low_stock is True

    engine.dispose()


def test_unhandled_server_error_sanitization():
    """Test that unexpected internal exceptions return 500 without stack traces."""
    from inventory.main import app
    with TestClient(app, raise_server_exceptions=False) as client_no_raise:
        with patch("inventory.routes.InventoryService.list_items", side_effect=RuntimeError("Secret internal error")):
            response = client_no_raise.get("/items")
            assert response.status_code == 500
            data = response.json()
            assert "Secret internal error" not in data.get("detail", "")
            assert data.get("detail") == "An internal server error occurred."


# ============================================================================
# Direct Service Unit Tests
# ============================================================================

def test_service_unit_exceptions(test_db_session: Session):
    """Unit test domain service exceptions directly."""
    # Test ItemNotFoundError
    with pytest.raises(ItemNotFoundError):
        InventoryService.get_item(test_db_session, 9999)

    # Create item via service
    item_in = ItemCreate(name="Unit Test Item", initial_quantity=10, low_stock_threshold=5)
    item = InventoryService.create_item(test_db_session, item_in)
    assert item.id is not None
    assert item.quantity == 10

    # Test InvalidAdjustmentError
    with pytest.raises(InvalidAdjustmentError):
        InventoryService.increase_stock(test_db_session, item.id, 0)
    with pytest.raises(InvalidAdjustmentError):
        InventoryService.increase_stock(test_db_session, item.id, -2)
    with pytest.raises(InvalidAdjustmentError):
        InventoryService.increase_stock(test_db_session, item.id, True)  # boolean rejected
    with pytest.raises(InvalidAdjustmentError):
        InventoryService.decrease_stock(test_db_session, item.id, 0)
    with pytest.raises(InvalidAdjustmentError):
        InventoryService.decrease_stock(test_db_session, item.id, -5)
    with pytest.raises(InvalidAdjustmentError):
        InventoryService.decrease_stock(test_db_session, item.id, False)  # boolean rejected

    # Test InsufficientStockError
    with pytest.raises(InsufficientStockError):
        InventoryService.decrease_stock(test_db_session, item.id, 15)
