from typing import Any, Dict, List, Optional
from uuid import UUID

from supabase import Client
from ..core.database import get_supabase
from ..models.analysis import (
    AnalysisRunCreate,
    AnalysisRunListResponse,
    AnalysisRunResponse,
    AnalysisStatsResponse,
    AnalysisType,
)


class AnalysisHistoryService:
    """Supabase-backed persistence for analysis runs."""

    def __init__(self, client: Optional[Client] = None) -> None:
        self.client: Client = client or get_supabase()

    def save_run(self, user_id: str, payload: AnalysisRunCreate) -> AnalysisRunResponse:
        record = payload.model_dump()
        record["user_id"] = user_id

        response = self.client.table("analysis_history").insert(record).execute()

        if not response.data:
            raise RuntimeError("Failed to save analysis run")

        return AnalysisRunResponse(**response.data[0])

    def list_runs(
        self,
        user_id: str,
        analysis_type: Optional[AnalysisType],
        limit: int = 10,
        cursor: Optional[str] = None,
    ) -> AnalysisRunListResponse:
        limit = max(1, min(limit, 50))  # enforce sane bounds

        query = (
            self.client.table("analysis_history")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
        )

        if analysis_type:
            query = query.eq("analysis_type", analysis_type)

        if cursor:
            query = query.lt("created_at", cursor)

        response = query.execute()
        data = response.data or []
        items = [AnalysisRunResponse(**row) for row in data]

        next_cursor = (
            items[-1].created_at.isoformat() if len(items) == limit else None
        )

        return AnalysisRunListResponse(items=items, next_cursor=next_cursor)

    def list_runs_by_channel(
        self,
        user_id: str,
        channel_id: UUID,
        limit: int = 10,
        cursor: Optional[str] = None,
    ) -> AnalysisRunListResponse:
        limit = max(1, min(limit, 50))

        query = (
            self.client.table("analysis_history")
            .select("*")
            .eq("user_id", user_id)
            .eq("channel_id", str(channel_id))
            .order("created_at", desc=True)
            .limit(limit)
        )

        if cursor:
            query = query.lt("created_at", cursor)

        response = query.execute()
        data = response.data or []
        items = [AnalysisRunResponse(**row) for row in data]

        next_cursor = (
            items[-1].created_at.isoformat() if len(items) == limit else None
        )

        return AnalysisRunListResponse(items=items, next_cursor=next_cursor)

    def get_run(self, user_id: str, analysis_id: str) -> AnalysisRunResponse:
        response = (
            self.client.table("analysis_history")
            .select("*")
            .eq("user_id", user_id)
            .eq("id", analysis_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            raise LookupError("Analysis run not found")

        return AnalysisRunResponse(**response.data[0])

    def delete_run(self, user_id: str, analysis_id: str) -> None:
        response = (
            self.client.table("analysis_history")
            .delete()
            .eq("user_id", user_id)
            .eq("id", analysis_id)
            .execute()
        )

        deleted = response.data or []
        if len(deleted) == 0:
            # Supabase returns None when nothing was deleted
            raise LookupError("Analysis run not found")

    def get_stats_by_channel(self, user_id: str, channel_id: UUID) -> AnalysisStatsResponse:
        total = self._count_runs(user_id=user_id, channel_id=channel_id)
        trends = self._count_runs(user_id=user_id, analysis_type="trends", channel_id=channel_id)
        viral = self._count_runs(user_id=user_id, analysis_type="viral", channel_id=channel_id)

        viral_videos = self._count_viral_videos(user_id=user_id, channel_id=channel_id)

        return AnalysisStatsResponse(
            total_runs=total,
            trends_runs=trends,
            viral_runs=viral,
            viral_videos=viral_videos,
        )

    def get_stats(self, user_id: str) -> AnalysisStatsResponse:
        total = self._count_runs(user_id=user_id)
        trends = self._count_runs(user_id=user_id, analysis_type="trends")
        viral = self._count_runs(user_id=user_id, analysis_type="viral")

        viral_videos = self._count_viral_videos(user_id=user_id)

        return AnalysisStatsResponse(
            total_runs=total,
            trends_runs=trends,
            viral_runs=viral,
            viral_videos=viral_videos,
        )

    def _count_runs(
        self,
        user_id: str,
        analysis_type: Optional[AnalysisType] = None,
        channel_id: Optional[UUID] = None,
    ) -> int:
        query = (
            self.client.table("analysis_history")
            .select("id", count="exact", head=True)
            .eq("user_id", user_id)
        )

        if analysis_type:
            query = query.eq("analysis_type", analysis_type)
        
        if channel_id:
            query = query.eq("channel_id", str(channel_id))

        response = query.execute()

        # Supabase python client exposes count attribute
        return response.count or 0

    def _count_viral_videos(self, user_id: str, channel_id: Optional[UUID] = None) -> int:
        query = (
            self.client.table("analysis_history")
            .select("result_summary")
            .eq("user_id", user_id)
            .eq("analysis_type", "viral")
        )

        if channel_id:
            query = query.eq("channel_id", str(channel_id))

        response = query.execute()

        data = response.data or []
        total_videos = 0
        for row in data:
            result = row.get("result") or {}
            videos = result.get("videos")
            if isinstance(videos, list):
                total_videos += len(videos)

        return total_videos

    def get_top_keywords(self, user_id: str, channel_id: Optional[UUID] = None, limit: int = 10) -> List[Dict[str, Any]]:
        query = (
            self.client.table("analysis_history")
            .select("keywords")
            .eq("user_id", user_id)
        )

        if channel_id:
            query = query.eq("channel_id", str(channel_id))

        response = query.execute()
        data = response.data or []

        keyword_counts = {}
        for row in data:
            keywords = row.get("keywords")
            if isinstance(keywords, list):
                for keyword in keywords:
                    keyword_counts[keyword] = keyword_counts.get(keyword, 0) + 1

        sorted_keywords = sorted(keyword_counts.items(), key=lambda item: item[1], reverse=True)
        return [{ "keyword": kw, "count": count } for kw, count in sorted_keywords[:limit]]


# Singleton service used by API layer
analysis_history_service = AnalysisHistoryService()
