"""Root entry point for Inventory Counter API."""

import uvicorn
from inventory.main import app

if __name__ == "__main__":
    uvicorn.run("inventory.main:app", host="127.0.0.1", port=8000, reload=True)
