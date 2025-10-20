
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from ..models.channel import Channel, ChannelCreate
from ..models.analysis import AnalysisRunListResponse, AnalysisStatsResponse
from ..services.channel_service import ChannelService
from ..services.analysis_history import analysis_history_service
from ..core.database import get_supabase
from .deps import get_current_user_id

router = APIRouter()


def get_channel_service(supabase: Client = Depends(get_supabase)) -> ChannelService:
    return ChannelService(supabase)


@router.post("/", response_model=Channel, status_code=status.HTTP_201_CREATED)
async def create_channel(
    channel_create: ChannelCreate,
    user_id: str = Depends(get_current_user_id),
    service: ChannelService = Depends(get_channel_service),
):
    """新しいYouTubeチャンネルを登録する"""
    try:
        user_uuid = UUID(user_id)
        created_channel = await service.create_channel(user_id=user_uuid, channel_create=channel_create)
        # Channelモデルに変換して返す
        return Channel.from_orm(created_channel)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/", response_model=List[Channel])
async def get_channels(
    user_id: str = Depends(get_current_user_id),
    service: ChannelService = Depends(get_channel_service),
):
    """登録済みのチャンネル一覧を取得する"""
    try:
        user_uuid = UUID(user_id)
        return await service.get_channels_by_user(user_id=user_uuid)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_channel(
    channel_id: UUID,
    user_id: str = Depends(get_current_user_id),
    service: ChannelService = Depends(get_channel_service),
):
    """登録済みのチャンネルを削除する"""
    try:
        user_uuid = UUID(user_id)
        await service.delete_channel(user_id=user_uuid, channel_id=channel_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{channel_id}/stats", response_model=AnalysisStatsResponse)
async def get_channel_stats(
    channel_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    """特定のチャンネルの統計情報を取得する"""
    try:
        user_uuid = UUID(user_id)
        # We can re-use the analysis history service here
        return analysis_history_service.get_stats_by_channel(user_id=user_uuid, channel_id=channel_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{channel_id}/analyses", response_model=AnalysisRunListResponse)
async def get_channel_analyses(
    channel_id: UUID,
    user_id: str = Depends(get_current_user_id),
    limit: int = 10,
    cursor: str | None = None,
):
    """特定のチャンネルの分析履歴を取得する"""
    try:
        user_uuid = UUID(user_id)
        return analysis_history_service.list_runs_by_channel(
            user_id=user_uuid, channel_id=channel_id, limit=limit, cursor=cursor
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{channel_id}/top-keywords", response_model=List[Dict[str, Any]])
async def get_channel_top_keywords(
    channel_id: UUID,
    user_id: str = Depends(get_current_user_id),
    limit: int = 10,
):
    """特定のチャンネルのよく使うキーワードを取得する"""
    try:
        user_uuid = UUID(user_id)
        return analysis_history_service.get_top_keywords(
            user_id=user_uuid, channel_id=channel_id, limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
