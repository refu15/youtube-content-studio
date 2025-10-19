from collections import Counter
from datetime import datetime, timezone
from typing import List, Optional

from ..models.dashboard import (
    DashboardOverviewRequest,
    DashboardOverviewResponse,
    DashboardPlatformSummary,
    DashboardQuickMetric,
    DashboardTrendingHighlights,
    DashboardViralHighlights,
)
from ..models.trends import PlatformTrends, TrendingVideo
from ..models.viral_finder import ViralVideo
from .trend_analyzer import trend_analyzer
from .viral_finder import viral_finder


class DashboardOverviewService:
    """ダッシュボード用の集約データを生成するサービス"""

    def generate_overview(
        self, request: DashboardOverviewRequest
    ) -> DashboardOverviewResponse:
        trends = trend_analyzer.analyze_trends(
            keywords=request.persona_keywords,
            platforms=request.platforms,
            max_results_per_platform=request.max_results_per_platform,
        )

        trend_highlights = self._build_trend_highlights(trends.platforms, trends)
        quick_metrics = self._build_quick_metrics(trend_highlights)

        viral_highlights: Optional[DashboardViralHighlights] = None
        if request.include_viral:
            viral_highlights = self._build_viral_highlights(
                persona_keywords=request.persona_keywords,
                platforms=request.viral_platforms,
                min_viral_ratio=request.min_viral_ratio,
                max_subscribers=request.max_subscribers,
                max_results=request.max_viral_results,
            )
            if viral_highlights and viral_highlights.videos:
                quick_metrics.extend(
                    self._build_viral_metrics(viral_highlights.videos)
                )

        recommended_actions = self._build_recommended_actions(
            trends.overall_insights,
            viral_highlights.content_strategies
            if viral_highlights
            else [],
            request.channel_goal,
        )

        return DashboardOverviewResponse(
            generated_at=datetime.now(timezone.utc),
            persona_keywords=request.persona_keywords,
            channel_goal=request.channel_goal,
            quick_metrics=quick_metrics,
            trending=trend_highlights,
            viral=viral_highlights,
            recommended_actions=recommended_actions,
        )

    def _build_trend_highlights(
        self, platforms: List[PlatformTrends], trends_response
    ) -> DashboardTrendingHighlights:
        all_videos: List[TrendingVideo] = [
            video for platform in platforms for video in platform.videos
        ]

        top_video = (
            max(all_videos, key=lambda v: v.view_count, default=None)
            if all_videos
            else None
        )

        tag_counter: Counter[str] = Counter()
        for video in all_videos:
            tag_counter.update([tag for tag in video.tags if tag])

        top_tags = [tag for tag, _ in tag_counter.most_common(10)]

        platform_summaries = []
        for platform in platforms:
            total_views = platform.total_views
            video_count = len(platform.videos)
            average_views = int(total_views / video_count) if video_count else 0
            top_videos = sorted(
                platform.videos, key=lambda v: v.view_count, reverse=True
            )[:3]

            platform_summaries.append(
                DashboardPlatformSummary(
                    platform=platform.platform,
                    total_videos=video_count,
                    total_views=total_views,
                    average_views=average_views,
                    top_videos=top_videos,
                    insights=platform.insights,
                )
            )

        return DashboardTrendingHighlights(
            overall_insights=trends_response.overall_insights,
            platform_summaries=platform_summaries,
            top_video=top_video,
            top_tags=top_tags,
        )

    def _build_quick_metrics(
        self, highlights: DashboardTrendingHighlights
    ) -> List[DashboardQuickMetric]:
        metrics: List[DashboardQuickMetric] = []

        total_videos = sum(summary.total_videos for summary in highlights.platform_summaries)
        total_views = sum(summary.total_views for summary in highlights.platform_summaries)
        active_platforms = len(highlights.platform_summaries)

        metrics.append(
            DashboardQuickMetric(
                id="total_trending_videos",
                label="トレンド動画",
                value=f"{total_videos}",
                context="選択したプラットフォームの合計件数",
            )
        )

        metrics.append(
            DashboardQuickMetric(
                id="total_views",
                label="累計再生回数",
                value=f"{total_views:,}" if total_views else "—",
                context="ダッシュボードで抽出した動画の合計再生数",
            )
        )

        average_views = int(total_views / total_videos) if total_videos else 0
        metrics.append(
            DashboardQuickMetric(
                id="avg_views",
                label="平均再生回数",
                value=f"{average_views:,}" if average_views else "—",
                context="動画あたりの平均再生数",
            )
        )

        metrics.append(
            DashboardQuickMetric(
                id="active_platforms",
                label="分析プラットフォーム",
                value=str(active_platforms),
                context="今回分析したプラットフォーム数",
            )
        )

        return metrics

    def _build_viral_highlights(
        self,
        persona_keywords: List[str],
        platforms: List[str],
        min_viral_ratio: float,
        max_subscribers: int,
        max_results: int,
    ) -> Optional[DashboardViralHighlights]:
        viral_response = viral_finder.find_viral_videos(
            keywords=persona_keywords,
            min_viral_ratio=min_viral_ratio,
            max_subscribers=max_subscribers,
            platforms=platforms,
            max_results=max_results,
        )

        if not viral_response.videos:
            return None

        return DashboardViralHighlights(
            videos=viral_response.videos[:max_results],
            insights=viral_response.insights,
            content_strategies=viral_response.content_strategies,
        )

    def _build_viral_metrics(
        self, viral_videos: List[ViralVideo]
    ) -> List[DashboardQuickMetric]:
        max_ratio_video = max(viral_videos, key=lambda v: v.viral_ratio, default=None)
        average_ratio = (
            sum(video.viral_ratio for video in viral_videos) / len(viral_videos)
            if viral_videos
            else 0
        )

        metrics: List[DashboardQuickMetric] = []

        if max_ratio_video:
            metrics.append(
                DashboardQuickMetric(
                    id="top_viral_ratio",
                    label="最高バイラル比率",
                    value=f"{max_ratio_video.viral_ratio:.1f}x",
                    context=f"{max_ratio_video.title}（{max_ratio_video.channel_name}）",
                )
            )

        if average_ratio:
            metrics.append(
                DashboardQuickMetric(
                    id="avg_viral_ratio",
                    label="平均バイラル比率",
                    value=f"{average_ratio:.1f}x",
                    context="抽出したバイラル候補動画の平均値",
                )
            )

        return metrics

    def _build_recommended_actions(
        self,
        trend_insights: List[str],
        strategies: List[str],
        channel_goal: Optional[str],
    ) -> List[str]:
        combined = list(trend_insights[:3]) + list(strategies[:3])

        if channel_goal:
            combined.append(f"目標「{channel_goal}」に沿ったKPIを設定し、週次で振り返りを行いましょう。")

        # 重複を削除しつつ順序を保持
        seen = set()
        deduped: List[str] = []
        for item in combined:
            if item and item not in seen:
                deduped.append(item)
                seen.add(item)

        return deduped[:6]


# Singleton instance
dashboard_overview_service = DashboardOverviewService()
