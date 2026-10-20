# Inventory Counter API

A modular, lightweight REST API built with **FastAPI** and **SQLite** that enables small-shop staff and developers to manage inventory items, perform stock adjustments, and automatically detect low-stock thresholds.

---

## Features & Business Rules

1. **Item Management**:
   - Create inventory items with a non-empty name, initial quantity ($\ge 0$), and low-stock threshold ($\ge 0$).
   - List all items or query a single item by its ID.
2. **Stock Adjustments**:
   - **Increase Stock**: Add to an item's stock with a positive integer quantity.
   - **Decrease Stock**: Deduct from an item's stock with a positive integer quantity.
   - **Negative Stock Prevention**: Stock decreases that would cause quantity to drop below zero are strictly rejected with HTTP 400 Bad Request.
   - **Positive Adjustment Invariant**: Adjustment quantities must be positive integers ($> 0$).
3. **Low-Stock Alerting**:
   - An item is automatically classified as low stock whenever `quantity <= low_stock_threshold`.
   - Dedicated endpoint `GET /items/{item_id}/stock-status` for quick threshold checks.
4. **Isolated Testing**:
   - Automated pytest suite running against temporary, isolated SQLite databases.

---

## Project Structure

```
.
├── aidlc/spaces/default/knowledge/documents/
│   └── intent.md            # Workshop intent specification
├── inventory/
│   ├── __init__.py          # Package declaration & version
│   ├── database.py          # SQLite engine, sessionmaker, & get_db dependency
│   ├── models.py            # SQLAlchemy Item model & properties
│   ├── schemas.py           # Pydantic schemas & input validators
│   ├── services.py          # Domain logic & business exception handling
│   ├── routes.py            # FastAPI APIRouter endpoints
│   └── main.py              # Application factory & global exception handlers
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures with temporary SQLite DB
│   └── test_items.py        # 36 unit, integration, concurrency & persistence tests
├── verify_integration.py    # Live server workflow verification runner
├── main.py                  # Direct entry point for running the server
├── pytest.ini               # Pytest configuration
├── requirements.txt         # Project dependencies
├── .gitignore               # Ignored files (SQLite DBs, pycache, venv)
└── README.md                # Project documentation
```

---

## Prerequisites

- **Python 3.10+** (Python 3.14+ compatible)
- No Docker or external database servers required.

---

## Installation & Setup

1. **Clone or Navigate to the Workspace**:
   ```bash
   cd "d:/Metric stream Project"
   ```

2. **Create and Activate a Virtual Environment** (Optional but recommended):
   ```bash
   python -m venv .venv
   # Windows PowerShell:
   .venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

## Running the Application

Start the local Uvicorn development server:

```bash
python main.py
```
Or directly with Uvicorn:
```bash
uvicorn inventory.main:app --host 127.0.0.1 --port 8000 --reload
```

Once started:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## Running the Automated Tests

Run the full pytest suite with isolated temporary SQLite databases:

```bash
pytest
```

To run with verbose output and coverage:
```bash
pytest -v
```

---

## API Endpoints Reference

### 1. Health & Root Info
- **Endpoint**: `GET /`
- **Description**: Verifies service status and provides documentation link.
- **Response**: `200 OK`
  ```json
  {
    "service": "Inventory Counter API",
    "version": "0.1.0",
    "status": "healthy",
    "documentation": "/docs"
  }
  ```

---

### 2. Create Inventory Item
- **Endpoint**: `POST /items`
- **Status Code**: `201 Created`
- **Request Body**:
  ```json
  {
    "name": "Mechanical Keyboard",
    "initial_quantity": 25,
    "low_stock_threshold": 5
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "name": "Mechanical Keyboard",
    "quantity": 25,
    "low_stock_threshold": 5,
    "is_low_stock": false,
    "created_at": "2026-10-20T18:00:00Z",
    "updated_at": "2026-10-20T18:00:00Z"
  }
  ```
- **Validation Errors**:
  - Empty or whitespace name returns `422 Unprocessable Entity`.
  - Negative initial quantity or threshold returns `422 Unprocessable Entity`.

---

### 3. List All Items
- **Endpoint**: `GET /items`
- **Query Parameters**:
  - `skip` (int, default: 0): Offset for pagination.
  - `limit` (int, default: 100): Maximum records to retrieve.
- **Status Code**: `200 OK`
- **Response**:
  ```json
  [
    {
      "id": 1,
      "name": "Mechanical Keyboard",
      "quantity": 25,
      "low_stock_threshold": 5,
      "is_low_stock": false,
      "created_at": "2026-10-20T18:00:00Z",
      "updated_at": "2026-10-20T18:00:00Z"
    }
  ]
  ```

---

### 4. Get Item by ID
- **Endpoint**: `GET /items/{item_id}`
- **Status Code**: `200 OK` (or `404 Not Found`)
- **Response**:
  ```json
  {
    "id": 1,
    "name": "Mechanical Keyboard",
    "quantity": 25,
    "low_stock_threshold": 5,
    "is_low_stock": false,
    "created_at": "2026-10-20T18:00:00Z",
    "updated_at": "2026-10-20T18:00:00Z"
  }
  ```

---

### 5. Increase Stock
- **Endpoint**: `POST /items/{item_id}/increase`
- **Status Code**: `200 OK`
- **Request Body**:
  ```json
  {
    "amount": 10
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "name": "Mechanical Keyboard",
    "quantity": 35,
    "low_stock_threshold": 5,
    "is_low_stock": false,
    "adjustment": 10,
    "action": "increase",
    "message": "Stock increased by 10. New quantity: 35."
  }
  ```

---

### 6. Decrease Stock
- **Endpoint**: `POST /items/{item_id}/decrease`
- **Status Code**: `200 OK`
- **Request Body**:
  ```json
  {
    "amount": 32
  }
  ```
- **Response** (When stock falls to or below threshold):
  ```json
  {
    "id": 1,
    "name": "Mechanical Keyboard",
    "quantity": 3,
    "low_stock_threshold": 5,
    "is_low_stock": true,
    "adjustment": 32,
    "action": "decrease",
    "message": "Stock decreased by 32. New quantity: 3. (Low stock threshold reached!)"
  }
  ```
- **Negative Stock Error Response** (`400 Bad Request`):
  ```json
  {
    "detail": "Cannot decrease stock by 100. Current stock is 3. Stock must never drop below zero."
  }
  ```

---

### 7. Check Low-Stock Status
- **Endpoint**: `GET /items/{item_id}/stock-status`
- **Status Code**: `200 OK`
- **Response**:
  ```json
  {
    "item_id": 1,
    "name": "Mechanical Keyboard",
    "quantity": 3,
    "low_stock_threshold": 5,
    "is_low_stock": true,
    "status_message": "Item 'Mechanical Keyboard' is low on stock! Current quantity (3) is at or below threshold (5)."
  }
  ```

---

## Error Codes Summary

| Status Code | Meaning | Example Trigger |
| :--- | :--- | :--- |
| **200 OK** | Success | Item fetched, stock adjusted, or status retrieved |
| **201 Created** | Resource Created | New item successfully stored in database |
| **400 Bad Request** | Business Invariant Violation | Attempting to decrease stock below 0, or passing non-positive adjustments |
| **404 Not Found** | Missing Resource | Requesting an item ID that does not exist |
| **422 Unprocessable Entity** | Schema Validation Failure | Empty item name, negative initial quantity, or invalid JSON payload |
