"""Live integration test executing the complete real-world workflow."""

import os
import sys
import time
import httpx
import uvicorn
import threading

# Set isolated test database environment variable before importing app
TEST_DB_FILE = "integration_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///./{TEST_DB_FILE}"

from inventory.main import app
from inventory.database import Base, engine

PORT = 8008
BASE_URL = f"http://127.0.0.1:{PORT}"


def run_server():
    config = uvicorn.Config(app=app, host="127.0.0.1", port=PORT, log_level="warning")
    server = uvicorn.Server(config)
    server.run()


def main():
    print("=" * 60)
    print("Starting Live API Integration Verification")
    print("=" * 60)

    # Initialize tables
    Base.metadata.create_all(bind=engine)

    # Start Uvicorn in background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Wait for server to become responsive
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)
    connected = False
    for attempt in range(20):
        try:
            res = client.get("/")
            if res.status_code == 200:
                connected = True
                print(f"[OK] Server is live and healthy on {BASE_URL}")
                print(f"     Root response: {res.json()}")
                break
        except Exception:
            time.sleep(0.3)

    if not connected:
        print("[FAIL] Could not connect to live server!")
        sys.exit(1)

    # Check /docs endpoint
    res_docs = client.get("/docs")
    assert res_docs.status_code == 200, f"Expected 200 for /docs, got {res_docs.status_code}"
    print(f"[OK] Swagger /docs is accessible (status {res_docs.status_code}, content-type: {res_docs.headers.get('content-type')})")

    # Workflow Step 1: Create an item with quantity 10 and threshold 3
    print("\n--- Workflow Step 1: Create Item (qty=10, threshold=3) ---")
    create_payload = {
        "name": "Integration Widget",
        "initial_quantity": 10,
        "low_stock_threshold": 3,
    }
    res_create = client.post("/items", json=create_payload)
    assert res_create.status_code == 201, f"Expected 201, got {res_create.status_code}: {res_create.text}"
    item = res_create.json()
    item_id = item["id"]
    print(f"[OK] Created Item ID: {item_id}, Name: {item['name']}, Quantity: {item['quantity']}, Threshold: {item['low_stock_threshold']}, is_low_stock: {item['is_low_stock']}")
    assert item["quantity"] == 10
    assert item["low_stock_threshold"] == 3
    assert item["is_low_stock"] is False

    # Workflow Step 2: Retrieve the item
    print("\n--- Workflow Step 2: Retrieve Item ---")
    res_get = client.get(f"/items/{item_id}")
    assert res_get.status_code == 200
    get_item = res_get.json()
    assert get_item["id"] == item_id
    assert get_item["quantity"] == 10
    print(f"[OK] Retrieved Item ID {item_id}: quantity = {get_item['quantity']}")

    # Workflow Step 3: Increase stock by 5 and verify quantity is 15
    print("\n--- Workflow Step 3: Increase Stock by 5 ---")
    res_inc = client.post(f"/items/{item_id}/increase", json={"amount": 5})
    assert res_inc.status_code == 200
    inc_data = res_inc.json()
    assert inc_data["quantity"] == 15
    print(f"[OK] Stock increased by 5: new quantity = {inc_data['quantity']}, message = '{inc_data['message']}'")

    # Workflow Step 4: Decrease stock by 13 and verify quantity is 2
    print("\n--- Workflow Step 4: Decrease Stock by 13 ---")
    res_dec = client.post(f"/items/{item_id}/decrease", json={"amount": 13})
    assert res_dec.status_code == 200
    dec_data = res_dec.json()
    assert dec_data["quantity"] == 2
    print(f"[OK] Stock decreased by 13: new quantity = {dec_data['quantity']}, is_low_stock = {dec_data['is_low_stock']}")

    # Workflow Step 5: Verify that the low-stock status is true
    print("\n--- Workflow Step 5: Check Low-Stock Status ---")
    res_status = client.get(f"/items/{item_id}/stock-status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["is_low_stock"] is True
    assert status_data["quantity"] == 2
    print(f"[OK] Low-stock status verified: is_low_stock = {status_data['is_low_stock']}, status_message = '{status_data['status_message']}'")

    # Workflow Step 6: Attempt to decrease quantity by 3 and verify that the operation is rejected
    print("\n--- Workflow Step 6: Attempt Overdraft Decrease by 3 (Available: 2) ---")
    res_overdraft = client.post(f"/items/{item_id}/decrease", json={"amount": 3})
    assert res_overdraft.status_code == 400, f"Expected 400 Bad Request, got {res_overdraft.status_code}"
    error_data = res_overdraft.json()
    print(f"[OK] Overdraft correctly rejected with 400 Bad Request: detail = '{error_data['detail']}'")

    # Workflow Step 7: Retrieve the item again and confirm quantity remains 2
    print("\n--- Workflow Step 7: Retrieve Item and Verify Quantity Remains 2 ---")
    res_final = client.get(f"/items/{item_id}")
    assert res_final.status_code == 200
    final_data = res_final.json()
    assert final_data["quantity"] == 2, f"Expected 2, got {final_data['quantity']}"
    print(f"[OK] Final quantity confirmed intact: quantity = {final_data['quantity']}")

    # Cleanup test database
    engine.dispose()
    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
            print(f"\n[OK] Cleaned up temporary integration database '{TEST_DB_FILE}'")
        except Exception as e:
            print(f"[INFO] Temporary database will be cleaned up by OS: {e}")

    print("\n" + "=" * 60)
    print("All Live Integration Tests and Workflows PASSED Successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
