from pydantic import BaseModel, Field
from typing import List, Optional


class PersonaInput(BaseModel):
    """ペルソナ入力モデル"""
    age_range: str = Field(..., description="年齢層（例：20-30代）")
    gender: str = Field(..., description="性別（例：男性、女性、全性別）")
    interests: List[str] = Field(..., description="興味関心（例：ビジネス、エンタメ、料理）")
    pain_points: List[str] = Field(..., description="悩み・課題（例：時間がない、お金がない）")
    goals: List[str] = Field(..., description="目標（例：スキルアップ、副業）")
    content_preferences: str = Field(..., description="好むコンテンツタイプ（例：短い動画、詳しい解説）")


class ChannelStrategyRequest(BaseModel):
    """チャンネル戦略リクエスト"""
    persona: PersonaInput
    channel_genre: str = Field(..., description="チャンネルジャンル（例：ビジネス、エンタメ、教育）")
    channel_name: Optional[str] = Field(None, description="チャンネル名（任意）")


class VideoConceptRequest(BaseModel):
    """動画コンセプトリクエスト"""
    persona: PersonaInput
    channel_genre: str
    video_count: int = Field(default=5, ge=1, le=20, description="生成する動画数（1-20）")


class VideoConcept(BaseModel):
    """動画コンセプト"""
    title: str
    description: str
    hook: str = Field(..., description="視聴者を引き込む冒頭フック")
    key_points: List[str] = Field(..., description="主要ポイント")
    cta: str = Field(..., description="Call to Action")
    estimated_length: str = Field(..., description="推奨動画尺（例：8-10分）")


class ChannelStrategy(BaseModel):
    """チャンネル戦略"""
    channel_concept: str = Field(..., description="チャンネルコンセプト")
    unique_value: str = Field(..., description="独自の価値提案")
    target_audience: str = Field(..., description="ターゲット視聴者")
    content_pillars: List[str] = Field(..., description="コンテンツの柱（3-5個）")
    posting_frequency: str = Field(..., description="投稿頻度の推奨")
    growth_strategy: List[str] = Field(..., description="成長戦略")
    video_concepts: List[VideoConcept] = Field(..., description="初期動画コンセプト")


class ContentCalendar(BaseModel):
    """コンテンツカレンダー"""
    week: int
    videos: List[VideoConcept]
    theme: str = Field(..., description="週のテーマ")


class PlanningResponse(BaseModel):
    """企画案レスポンス"""
    strategy: ChannelStrategy
    calendar: List[ContentCalendar] = Field(..., description="4週間のカレンダー")


class ShootingMaterialsRequest(BaseModel):
    """撮影資料生成リクエスト"""
    video_concept: VideoConcept
    format: str = Field("json", description="出力フォーマット (jsonまたはmarkdown)")


from .trends import TrendingAnalysisRequest
from .viral_finder import ViralFinderRequest

class CombinedPlanRequest(BaseModel):
    trends_request: TrendingAnalysisRequest
    viral_request: ViralFinderRequest
    channel_genre: str
    channel_name: Optional[str] = None
