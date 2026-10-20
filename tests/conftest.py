from collections.abc import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from inventory.database import Base, get_db
from inventory.main import app


@pytest.fixture
def test_db_session(tmp_path) -> Generator[Session, None, None]:
    """Fixture providing a direct session to a temporary SQLite database."""
    db_file = tmp_path / "test_direct.db"
    test_db_url = f"sqlite:///{db_file}"
    engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def client(tmp_path) -> Generator[TestClient, None, None]:
    """Fixture providing a TestClient backed by an isolated temporary SQLite database."""
    db_file = tmp_path / "test_api.db"
    test_db_url = f"sqlite:///{db_file}"
    engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    engine.dispose()
