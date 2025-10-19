from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

AnalysisType = Literal["trends", "viral"]


class AnalysisRunBase(BaseModel):
    """Common fields shared by analysis run payloads."""

    analysis_type: AnalysisType = Field(..., description="Type of analysis that was executed")
    keywords: List[str] = Field(default_factory=list, description="Keywords used for the analysis")
    platforms: List[str] = Field(default_factory=list, description="Platforms targeted in the analysis")
    summary: Optional[str] = Field(
        None,
        description="Short text used to display the run in lists",
    )
    channel_id: Optional[UUID] = Field(
        None,
        description="Optional reference to a registered channel",
    )
    meta: Dict[str, Any] = Field(
        default_factory=dict,
        description="Original request payload or metadata necessary to re-run",
    )
    result: Dict[str, Any] = Field(
        default_factory=dict,
        description="Full analysis result in JSON form",
    )


class AnalysisRunCreate(AnalysisRunBase):
    """Payload for creating a new analysis run record."""

    pass


class AnalysisRunResponse(AnalysisRunBase):
    """Response model returned when reading analysis history."""

    id: str
    user_id: str
    created_at: datetime


class AnalysisRunListResponse(BaseModel):
    """Wrapper for paginated analysis history responses."""

    items: List[AnalysisRunResponse]
    next_cursor: Optional[str] = Field(
        None,
        description="Opaque cursor used to fetch the next page (created_at ISO string)",
    )


class AnalysisStatsResponse(BaseModel):
    """Aggregated analysis statistics for the current user."""

    total_runs: int = Field(..., description="保存済み分析の合計件数")
    trends_runs: int = Field(..., description="トレンド分析の保存件数")
    viral_runs: int = Field(..., description="バイラル分析の保存件数")
    viral_videos: int = Field(..., description="保存されたバイラル分析に含まれる動画の総数")
