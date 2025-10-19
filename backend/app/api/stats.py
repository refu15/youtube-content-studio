
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from ..services.analysis_history import analysis_history_service
from .deps import get_current_user_id

router = APIRouter()

@router.get("/top-keywords", response_model=List[Dict[str, Any]])
async def get_top_keywords(
    user_id: str = Depends(get_current_user_id),
    limit: int = 10,
):
    """ユーザー全体のよく使うキーワードを取得する"""
    try:
        user_uuid = UUID(user_id)
        return analysis_history_service.get_top_keywords(user_id=user_uuid, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
