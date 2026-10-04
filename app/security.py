import hashlib
import hmac
import secrets
import time
from datetime import datetime, timedelta, timezone

import jwt

ALGO = "HS256"
PBKDF2_ROUNDS = 260_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), PBKDF2_ROUNDS).hex()
    return f"pbkdf2_sha256${PBKDF2_ROUNDS}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, rounds, salt, digest = stored.split("$")
        calc = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(rounds)).hex()
        return hmac.compare_digest(calc, digest)
    except (ValueError, TypeError):
        return False


def create_token(secret: str, sub: str, role: str, hours: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": sub, "role": role, "iat": now, "exp": now + timedelta(hours=hours)}
    return jwt.encode(payload, secret, algorithm=ALGO)


def decode_token(secret: str, token: str) -> dict | None:
    try:
        return jwt.decode(token, secret, algorithms=[ALGO])
    except jwt.PyJWTError:
        return None


class LoginLimiter:
    """In-memory failed-attempt limiter per client key."""

    def __init__(self, max_failures: int = 10, window_seconds: int = 600) -> None:
        self.max_failures = max_failures
        self.window = window_seconds
        self._fails: dict[str, list[float]] = {}

    def blocked(self, key: str) -> bool:
        now = time.time()
        hits = [t for t in self._fails.get(key, []) if now - t < self.window]
        self._fails[key] = hits
        return len(hits) >= self.max_failures

    def fail(self, key: str) -> None:
        self._fails.setdefault(key, []).append(time.time())

    def reset(self, key: str) -> None:
        self._fails.pop(key, None)
