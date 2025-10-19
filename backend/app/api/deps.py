from fastapi import Header, HTTPException, status


def get_current_user_id(x_user_id: str = Header(None)) -> str:
    """Temporary helper to fetch the authenticated user id from headers.

    NOTE: Replace with proper JWT validation when Supabase service role or
    Auth webhook integration is ready.
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-Id header is required",
        )
    return x_user_id
