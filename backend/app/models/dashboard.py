from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .trends import PlatformTrends, TrendingVideo
from .viral_finder import ViralFinderResponse, ViralVideo


class DashboardQuickMetric(BaseModel):
    """ダッシュボードの主要指標"""

    id: str = Field(..., description="フロントエンドで使用する一意の識別子")
    label: str = Field(..., description="指標名")
    value: str = Field(..., description="表示用に整形された値")
    delta: Optional[str] = Field(
        None,
        description="前回比などの補足情報（例: '+12% vs 先週'）",
    )
    context: Optional[str] = Field(
        None,
        description="指標に関する簡単な説明",
    )


class DashboardPlatformSummary(BaseModel):
    """プラットフォーム別のサマリー"""

    platform: str
    total_videos: int
    total_views: int
    average_views: int
    top_videos: List[TrendingVideo] = Field(
        default_factory=list,
        description="注目すべき動画（最大3件）",
    )
    insights: List[str] = Field(
        default_factory=list,
        description="プラットフォーム固有の傾向",
    )


class DashboardTrendingHighlights(BaseModel):
    """トレンド分析ハイライト"""

    overall_insights: List[str] = Field(
        default_factory=list, description="全体傾向のまとめ"
    )
    platform_summaries: List[DashboardPlatformSummary] = Field(
        default_factory=list,
        description="プラットフォーム別サマリー",
    )
    top_video: Optional[TrendingVideo] = Field(
        None, description="最も勢いのある動画"
    )
    top_tags: List[str] = Field(
        default_factory=list,
        description="頻出ハッシュタグ（最大10件）",
    )


class DashboardViralHighlights(BaseModel):
    """バイラル分析ハイライト"""

    videos: List[ViralVideo] = Field(
        default_factory=list, description="フィルタ済みの注目動画"
    )
    insights: List[str] = Field(
        default_factory=list, description="バイラル動画に共通するパターン"
    )
    content_strategies: List[str] = Field(
        default_factory=list, description="実行可能なコンテンツ戦略"
    )


class DashboardOverviewRequest(BaseModel):
    """ダッシュボード概要リクエスト"""

    persona_keywords: List[str] = Field(
        ..., min_items=1, description="ペルソナや扱いたいテーマに紐づくキーワード"
    )
    channel_goal: Optional[str] = Field(
        None, description="チャンネルで達成したい目標（任意）"
    )
    platforms: List[str] = Field(
        default_factory=lambda: ["YouTube", "TikTok", "Instagram"],
        description="分析対象プラットフォーム",
    )
    max_results_per_platform: int = Field(
        default=5, ge=1, le=20, description="プラットフォームごとの取得件数"
    )
    include_viral: bool = Field(
        default=True, description="バイラル分析を含めるかどうか"
    )
    viral_platforms: List[str] = Field(
        default_factory=lambda: ["YouTube"],
        description="バイラル分析対象プラットフォーム",
    )
    min_viral_ratio: float = Field(
        default=3.0, ge=0.0, description="バイラル判定とする最小比率"
    )
    max_subscribers: int = Field(
        default=100000,
        ge=1000,
        description="バイラル分析で対象とする最大登録者数",
    )
    max_viral_results: int = Field(
        default=6, ge=1, le=20, description="バイラル動画の取得件数"
    )


class DashboardOverviewResponse(BaseModel):
    """ダッシュボード概要レスポンス"""

    generated_at: datetime = Field(
        default_factory=datetime.utcnow, description="レポート生成時刻（UTC）"
    )
    persona_keywords: List[str]
    channel_goal: Optional[str] = None
    quick_metrics: List[DashboardQuickMetric] = Field(
        default_factory=list, description="主要指標カードで使うデータ"
    )
    trending: DashboardTrendingHighlights = Field(
        default_factory=DashboardTrendingHighlights,
        description="トレンド分析ハイライト",
    )
    viral: Optional[DashboardViralHighlights] = Field(
        default=None, description="バイラル分析ハイライト（任意）"
    )
    recommended_actions: List[str] = Field(
        default_factory=list,
        description="すぐに着手できるアクションアイデア",
    )
