import httpx
import jwt
from fastapi import Header, HTTPException
from functools import lru_cache

from app.core.config import settings

JWKS_URL = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"


@lru_cache
def get_jwks():
    resp = httpx.get(JWKS_URL, timeout=5)
    resp.raise_for_status()
    return resp.json()


async def get_current_user(authorization: str = Header(...)) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        jwks = get_jwks()
        header = jwt.get_unverified_header(token)
        key_data = next(k for k in jwks["keys"] if k["kid"] == header["kid"])
        signing_key = jwt.PyJWK(key_data).key

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
        return payload
    except StopIteration:
        get_jwks.cache_clear()  # key rotation happened — refetch next time
        raise HTTPException(status_code=401, detail="Unknown signing key")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user_optional(authorization: str | None = Header(default=None)) -> dict | None:
    """Same as get_current_user, but returns None instead of raising when
    there's no (or an invalid) bearer token — for endpoints like
    POST /support/tickets that accept anonymous submissions but attach the
    caller's identity when they're logged in.
    """
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None