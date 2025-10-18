from pydantic import BaseModel, Field
from typing import List, Optional


class ViralVideo(BaseModel):
    """バイラルポテンシャルのある動画"""
    platform: str
    title: str
    channel_name: str
    subscriber_count: int = Field(..., description="チャンネル登録者数")
    view_count: int
    video_id: str
    url: str
    thumbnail_url: Optional[str] = None
    like_count: Optional[int] = None
    comment_count: Optional[int] = None
    published_at: str
    viral_ratio: float = Field(..., description="再生数 / 登録者数の比率")
    why_viral: str = Field(..., description="バイラルになった理由の分析")
    key_takeaways: List[str] = Field(..., description="この動画から学べるポイント")


class ViralFinderRequest(BaseModel):
    """バイラル動画検索リクエスト"""
    keywords: List[str] = Field(..., description="検索キーワード")
    min_viral_ratio: float = Field(default=3.0, description="最小バイラル比率（再生数/登録者数）")
    max_subscribers: int = Field(default=100000, description="最大登録者数")
    platforms: List[str] = Field(default=["YouTube"], description="検索対象プラットフォーム")
    max_results: int = Field(default=20, ge=1, le=50)


class ViralFinderResponse(BaseModel):
    """バイラル動画検索レスポンス"""
    videos: List[ViralVideo]
    insights: List[str] = Field(..., description="バイラル動画の共通パターン分析")
    content_strategies: List[str] = Field(..., description="コンテンツ戦略の提案")
