from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class VideoPerformance(BaseModel):
    """動画のパフォーマンスデータ"""
    title: str
    views: int
    watch_time_hours: float
    average_view_duration_seconds: float
    impressions: int
    ctr_percentage: float = Field(..., description="クリック率（%）")
    likes: Optional[int] = None
    comments: Optional[int] = None
    shares: Optional[int] = None
    published_date: Optional[str] = None


class ChannelMetrics(BaseModel):
    """チャンネル全体のメトリクス"""
    total_views: int
    total_watch_time_hours: float
    average_view_duration_seconds: float
    subscriber_change: int
    total_videos_analyzed: int
    date_range: str


class Insight(BaseModel):
    """分析からの洞察"""
    category: str = Field(..., description="カテゴリ（例: パフォーマンス、エンゲージメント、最適化）")
    priority: str = Field(..., description="優先度（高/中/低）")
    finding: str = Field(..., description="発見した事実")
    recommendation: str = Field(..., description="推奨アクション")
    expected_impact: str = Field(..., description="期待される効果")


class TopPerformer(BaseModel):
    """トップパフォーマンス動画"""
    title: str
    metric_name: str = Field(..., description="評価指標（例: 再生回数、視聴時間、CTR）")
    metric_value: float
    why_successful: str = Field(..., description="成功した理由の分析")


class AnalyticsReport(BaseModel):
    """分析レポート"""
    channel_metrics: ChannelMetrics
    top_performers: List[TopPerformer]
    insights: List[Insight]
    content_recommendations: List[str] = Field(..., description="コンテンツ戦略の推奨事項")
    optimization_tips: List[str] = Field(..., description="最適化のヒント")
    next_actions: List[str] = Field(..., description="次に取るべきアクション")
