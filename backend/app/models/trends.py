from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class TrendingVideo(BaseModel):
    """トレンド動画情報"""
    platform: str = Field(..., description="プラットフォーム (YouTube/TikTok/Instagram)")
    title: str
    channel_name: str = Field(..., description="チャンネル名/アカウント名")
    video_id: str
    url: str
    thumbnail_url: Optional[str] = None
    view_count: int
    like_count: Optional[int] = None
    comment_count: Optional[int] = None
    published_at: str
    duration: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    description: str = ""
    relevance_score: Optional[float] = Field(None, description="ペルソナとの関連性スコア")
    why_trending: str = Field(..., description="トレンドになっている理由の分析")


class TrendingAnalysisRequest(BaseModel):
    """トレンド分析リクエスト"""
    persona_keywords: List[str] = Field(..., description="ペルソナに関連するキーワード")
    platforms: List[str] = Field(default=["YouTube", "TikTok", "Instagram"], description="分析対象プラットフォーム")
    max_results_per_platform: int = Field(default=10, ge=1, le=50)


class PlatformTrends(BaseModel):
    """プラットフォーム別トレンド"""
    platform: str
    videos: List[TrendingVideo]
    total_views: int
    insights: List[str] = Field(..., description="プラットフォーム別の傾向分析")


class TrendsAnalysisResponse(BaseModel):
    """トレンド分析レスポンス"""
    platforms: List[PlatformTrends]
    overall_insights: List[str] = Field(..., description="全体的な傾向とおすすめ")
    analyzed_at: str
