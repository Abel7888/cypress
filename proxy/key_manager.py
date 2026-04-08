"""
API key encryption/decryption using Fernet symmetric encryption.
Keys are encrypted at rest in PostgreSQL and decrypted only when
needed for outbound API calls.
"""

import base64
import os

from cryptography.fernet import Fernet, InvalidToken
from pydantic_settings import BaseSettings


class SecretsSettings(BaseSettings):
    encryption_key: str = ""

    class Config:
        env_prefix = ""


_settings = SecretsSettings()


def _get_fernet() -> Fernet:
    key = _settings.encryption_key
    if not key:
        raise RuntimeError(
            "ENCRYPTION_KEY environment variable is not set. "
            "Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
        )
    if len(base64.urlsafe_b64decode(key)) != 32:
        raise RuntimeError("ENCRYPTION_KEY must be a 32-byte Fernet key (base64-encoded).")
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_api_key(plaintext_key: str) -> str:
    """Encrypt a provider API key for storage."""
    f = _get_fernet()
    return f.encrypt(plaintext_key.encode("utf-8")).decode("utf-8")


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt a stored provider API key for use in outbound calls."""
    f = _get_fernet()
    try:
        return f.decrypt(encrypted_key.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        raise ValueError("Failed to decrypt API key — wrong ENCRYPTION_KEY or corrupted data.")


def get_key_prefix(api_key: str) -> str:
    """Return a safe display prefix like 'sk-...abc1'."""
    if len(api_key) <= 8:
        return api_key[:4] + "..."
    return api_key[:5] + "..." + api_key[-4:]
