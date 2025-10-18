from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    ChannelStrategyRequest,
    VideoConceptRequest,
    ChannelStrategy,
    VideoConcept,
    PlanningResponse,
    PersonaInput
)
from ..services.ai_planner import ai_planner
from typing import List

router = APIRouter()


@router.post("/strategy", response_model=ChannelStrategy)
async def generate_channel_strategy(request: ChannelStrategyRequest):
    """
    チャンネル戦略を生成

    ペルソナとジャンルに基づいて、包括的なチャンネル戦略を提案します。
    """
    try:
        strategy = ai_planner.generate_channel_strategy(
            persona=request.persona,
            channel_genre=request.channel_genre,
            channel_name=request.channel_name
        )
        return strategy
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"戦略生成に失敗しました: {str(e)}")


@router.post("/video-concepts", response_model=List[VideoConcept])
async def generate_video_concepts(request: VideoConceptRequest):
    """
    動画コンセプトを生成

    ペルソナに基づいて、複数の動画アイデアを提案します。
    """
    try:
        concepts = ai_planner.generate_video_concepts(
            persona=request.persona,
            channel_genre=request.channel_genre,
            video_count=request.video_count
        )
        return concepts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"動画コンセプト生成に失敗しました: {str(e)}")


@router.post("/full-plan", response_model=PlanningResponse)
async def generate_full_plan(request: ChannelStrategyRequest):
    """
    完全な企画案を生成

    チャンネル戦略と4週間のコンテンツカレンダーを含む、包括的な企画案を生成します。
    """
    try:
        plan = ai_planner.generate_full_plan(
            persona=request.persona,
            channel_genre=request.channel_genre,
            channel_name=request.channel_name
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"企画案生成に失敗しました: {str(e)}")


@router.get("/health")
async def health_check():
    """API ヘルスチェック"""
    return {"status": "healthy", "service": "planning"}
