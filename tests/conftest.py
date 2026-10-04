import io
import os
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
_boot_dir = tempfile.mkdtemp(prefix="portal-boot-")
os.environ.setdefault("PORTAL_DATA_DIR", os.path.join(_boot_dir, "data"))
os.environ.setdefault("PORTAL_UPLOAD_DIR", os.path.join(_boot_dir, "uploads"))

from fastapi.testclient import TestClient  # noqa: E402

from app.config import Settings  # noqa: E402
from app.main import create_app  # noqa: E402

ADMIN_PW = "test-admin-pass"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("PORTAL_DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("PORTAL_UPLOAD_DIR", str(tmp_path / "uploads"))
    monkeypatch.setenv("ADMIN_PASSWORD", ADMIN_PW)
    monkeypatch.setenv("ADMIN_USERNAME", "admin")
    monkeypatch.delenv("JWT_SECRET", raising=False)
    return TestClient(create_app(Settings()))


@pytest.fixture()
def admin_headers(client):
    r = client.post("/api/admin/login", json={"username": "admin", "password": ADMIN_PW})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def png_bytes(color=(200, 30, 60)) -> bytes:
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (64, 32), color).save(buf, "PNG")
    return buf.getvalue()
