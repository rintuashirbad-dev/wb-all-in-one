import os
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"


def _load_dotenv() -> None:
    env_file = BASE_DIR / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.data_dir = Path(os.environ.get("PORTAL_DATA_DIR", BASE_DIR / "data")).resolve()
        self.upload_dir = Path(os.environ.get("PORTAL_UPLOAD_DIR", BASE_DIR / "uploads")).resolve()
        self.db_path = self.data_dir / "portal.db"
        self.admin_username = os.environ.get("ADMIN_USERNAME", "admin")
        self.admin_password = os.environ.get("ADMIN_PASSWORD", "")
        self.max_upload_bytes = int(float(os.environ.get("MAX_UPLOAD_MB", "5")) * 1024 * 1024)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.jwt_secret = os.environ.get("JWT_SECRET") or self._persisted_secret()

    def _persisted_secret(self) -> str:
        path = self.data_dir / ".jwt_secret"
        if path.exists():
            return path.read_text().strip()
        secret = secrets.token_urlsafe(48)
        path.write_text(secret)
        try:
            path.chmod(0o600)
        except OSError:
            pass
        return secret


def get_settings() -> Settings:
    return Settings()
