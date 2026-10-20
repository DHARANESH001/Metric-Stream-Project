# Inventory Counter — Full Stack Project

A modern, responsive full-stack inventory counter system with a **FastAPI + SQLite** backend and a **React + Vite + Tailwind CSS** frontend.

---

## Project Structure

```
d:/Metric stream Project/
├── backend/                 # FastAPI REST API & SQLite Database
│   ├── aidlc/               # Workshop intent specification documents
│   ├── inventory/           # Application package (models, schemas, routes, services)
│   │   ├── database.py      # SQLite configuration & session management
│   │   ├── main.py          # FastAPI application factory & CORS setup
│   │   ├── models.py        # SQLAlchemy Item model
│   │   ├── routes.py        # Item CRUD & stock adjustment endpoints
│   │   ├── schemas.py       # Pydantic schemas with strict validation
│   │   └── services.py      # Atomic transaction logic & exception handling
│   ├── tests/               # 36 unit, integration, persistence & concurrency tests
│   │   ├── conftest.py      # Isolated temporary SQLite database fixture
│   │   └── test_items.py    # Complete test suite
│   ├── main.py              # Backend entry point for Uvicorn
│   ├── pytest.ini           # Pytest configuration
│   ├── requirements.txt     # Python dependencies
│   └── verify_integration.py# Live backend integration test runner
│
├── frontend/                # React.js + Vite + Tailwind CSS Application
│   ├── public/              # Static icons & assets
│   ├── src/
│   │   ├── components/      # UI components (Table, Modals, Badges, Cards, Sidebar)
│   │   ├── hooks/           # Custom React hooks (useInventory)
│   │   ├── pages/           # Dashboard page with live KPIs & table
│   │   ├── services/        # Centralized Axios client (api.js, inventoryService.js)
│   │   ├── utils/           # Stock status rules & metric calculation
│   │   ├── App.jsx          # Main layout & modal orchestration
│   │   ├── index.css        # Tailwind CSS styles & design system
│   │   └── main.jsx         # React application entry point
│   ├── .env                 # VITE_API_BASE_URL=http://127.0.0.1:8000
│   ├── package.json         # Frontend dependencies & build scripts
│   └── vite.config.js       # Vite & Tailwind configuration with proxy
│
├── .gitignore               # Root git exclusions for Python, SQLite, & Node
└── README.md                # Project documentation
```

---

## Getting Started

### 1. Run the Backend (Python FastAPI)

1. Open a terminal and navigate to `backend/`:
   ```powershell
   cd "d:/Metric stream Project/backend"
   ```

2. Activate the virtual environment:
   ```powershell
   # Windows PowerShell:
   ..\.venv\Scripts\Activate.ps1
   ```

3. Install dependencies (if not already installed):
   ```powershell
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```powershell
   python main.py
   # Or directly with Uvicorn:
   uvicorn main:app --reload
   ```

- **Backend Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Endpoint**: `GET /`

5. Run automated backend tests:
   ```powershell
   python -m pytest -v
   ```

---

### 2. Run the Frontend (React + Vite)

1. Open a second terminal and navigate to `frontend/`:
   ```powershell
   cd "d:/Metric stream Project/frontend"
   ```

2. Install dependencies (if not already installed):
   ```powershell
   npm install
   ```

3. Start the frontend development server:
   ```powershell
   npm run dev
   ```

- **Frontend URL**: `http://localhost:5173/`

4. Build for production:
   ```powershell
   npm run build
   ```

---

## Core Features

- **Live Dynamic KPI Cards**: Instant calculation of total items, total units, low-stock count, and out-of-stock count.
- **Stock Status Badges**:
  - `In Stock` (Green): Current stock exceeds alert threshold.
  - `Low Stock` (Amber): Stock is at or below alert threshold ($0 < quantity \le threshold$).
  - `Out of Stock` (Red): Quantity equals 0.
- **Atomic Stock Adjustments**: Increase and Decrease actions backed by atomic conditional updates preventing negative stock.
- **Full Search, Filter & Sort**: Real-time filtering by item name, status pills, and column sorting.
- **Responsive Layout**: Desktop sidebar with mobile drawer navigation and card views.
