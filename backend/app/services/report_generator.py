from datetime import datetime
from typing import List
from ..models.trends import TrendsAnalysisResponse, TrendingVideo
from ..models.viral_finder import ViralFinderResponse
from ..models.analytics import AnalyticsReport
from ..models.schemas import PlanningResponse


class ReportGenerator:
    """Markdownレポート生成サービス"""

    def generate_trends_report(self, data: TrendsAnalysisResponse) -> str:
        """トレンド分析レポートを生成"""

        report = f"""# トレンド動画分析レポート

**生成日時**: {datetime.now().strftime('%Y年%m月%d日 %H:%M')}

---

## 📊 総合分析

"""
        for idx, insight in enumerate(data.overall_insights, 1):
            report += f"{idx}. {insight}\n"

        report += "\n---\n\n"

        # プラットフォーム別
        for platform_data in data.platforms:
            report += f"## {platform_data.platform}\n\n"
            report += f"**分析動画数**: {len(platform_data.videos)}本\n"
            report += f"**合計再生回数**: {platform_data.total_views:,}回\n\n"

            report += "### プラットフォーム別傾向\n\n"
            for insight in platform_data.insights:
                report += f"- {insight}\n"

            report += f"\n### トップ動画\n\n"
            for idx, video in enumerate(platform_data.videos[:5], 1):
                report += f"#### {idx}. {video.title}\n\n"
                report += f"- **チャンネル**: {video.channel_name}\n"
                report += f"- **再生回数**: {video.view_count:,}回\n"
                if video.like_count:
                    report += f"- **いいね数**: {video.like_count:,}\n"
                report += f"- **トレンド理由**: {video.why_trending}\n"
                if video.tags:
                    report += f"- **タグ**: {', '.join(video.tags[:5])}\n"
                report += "\n"

            report += "---\n\n"

        return report

    def generate_viral_report(self, data: ViralFinderResponse) -> str:
        """バイラル動画レポートを生成"""

        report = f"""# バイラル動画発見レポート

**生成日時**: {datetime.now().strftime('%Y年%m月%d日 %H:%M')}
**発見動画数**: {len(data.videos)}本

---

## 🎯 コンテンツ戦略の提案

"""
        for idx, strategy in enumerate(data.content_strategies, 1):
            report += f"{idx}. {strategy}\n"

        report += "\n---\n\n## 🔍 バイラル動画の共通パターン\n\n"

        for insight in data.insights:
            report += f"- {insight}\n"

        report += "\n---\n\n## ⚡ バイラル動画一覧\n\n"

        for idx, video in enumerate(data.videos, 1):
            report += f"### {idx}. {video.title}\n\n"
            report += f"- **チャンネル**: {video.channel_name}\n"
            report += f"- **登録者数**: {video.subscriber_count:,}人\n"
            report += f"- **再生回数**: {video.view_count:,}回\n"
            report += f"- **バイラル比率**: {video.viral_ratio}倍 🔥\n"
            report += f"\n**なぜバイラルになったか:**\n{video.why_viral}\n\n"

            if video.key_takeaways:
                report += "**学べるポイント:**\n"
                for takeaway in video.key_takeaways:
                    report += f"- {takeaway}\n"
                report += "\n"

            report += "---\n\n"

        return report

    def generate_analytics_report(self, data: AnalyticsReport) -> str:
        """CSV分析レポートを生成"""

        report = f"""# YouTubeアナリティクス分析レポート

**生成日時**: {datetime.now().strftime('%Y年%m月%d日 %H:%M')}
**分析期間**: {data.channel_metrics.date_range}

---

## 📈 チャンネル全体のメトリクス

| 指標 | 値 |
|------|------|
| 総再生回数 | {data.channel_metrics.total_views:,}回 |
| 総視聴時間 | {data.channel_metrics.total_watch_time_hours:,}時間 |
| 平均視聴時間 | {data.channel_metrics.average_view_duration_seconds:.0f}秒 |
| 登録者増減 | {data.channel_metrics.subscriber_change:+,}人 |
| 分析動画数 | {data.channel_metrics.total_videos_analyzed}本 |

---

## 🏆 トップパフォーマンス動画

"""
        for performer in data.top_performers:
            report += f"### {performer.title}\n\n"
            report += f"- **評価指標**: {performer.metric_name}\n"
            report += f"- **数値**: {performer.metric_value:,.0f}\n"
            report += f"- **成功理由**: {performer.why_successful}\n\n"

        report += "---\n\n## 💡 重要な洞察と推奨事項\n\n"

        for idx, insight in enumerate(data.insights, 1):
            report += f"### {idx}. [{insight.priority}] {insight.category}\n\n"
            report += f"**発見**: {insight.finding}\n\n"
            report += f"**推奨**: {insight.recommendation}\n\n"
            report += f"**期待効果**: {insight.expected_impact}\n\n"
            report += "---\n\n"

        report += "## 🎬 コンテンツ戦略の推奨\n\n"
        for idx, rec in enumerate(data.content_recommendations, 1):
            report += f"{idx}. {rec}\n"

        report += "\n---\n\n## 🔧 最適化のヒント\n\n"
        for tip in data.optimization_tips:
            report += f"- {tip}\n"

        report += "\n---\n\n## ✅ 次に取るべきアクション\n\n"
        for idx, action in enumerate(data.next_actions, 1):
            report += f"{idx}. {action}\n"

        report += "\n"

        return report

    def generate_planning_report(self, data: PlanningResponse) -> str:
        """AI企画案レポートを生成"""

        report = f"""# AI企画案レポート

**生成日時**: {datetime.now().strftime('%Y年%m月%d日 %H:%M')}

---

## 🎯 チャンネル戦略

### コンセプト
{data.strategy.channel_concept}

### 独自の価値提案
{data.strategy.unique_value}

### ターゲット視聴者
{data.strategy.target_audience}

### コンテンツの柱

"""
        for idx, pillar in enumerate(data.strategy.content_pillars, 1):
            report += f"{idx}. {pillar}\n"

        report += f"\n### 投稿頻度\n{data.strategy.posting_frequency}\n\n"

        report += "### 成長戦略\n\n"
        for idx, strategy in enumerate(data.strategy.growth_strategy, 1):
            report += f"{idx}. {strategy}\n"

        report += "\n---\n\n## 📅 4週間コンテンツカレンダー\n\n"

        for week in data.calendar:
            report += f"### 第{week.week}週: {week.theme}\n\n"
            for idx, video in enumerate(week.videos, 1):
                report += f"#### 動画{idx}: {video.title}\n\n"
                report += f"**内容**: {video.description}\n\n"
                report += f"**冒頭フック**: {video.hook}\n\n"
                report += "**主要ポイント**:\n"
                for point in video.key_points:
                    report += f"- {point}\n"
                report += f"\n**CTA**: {video.cta}\n"
                report += f"**推奨尺**: {video.estimated_length}\n\n"

            report += "---\n\n"

        report += "## 🎬 初期動画コンセプト\n\n"

        for idx, video in enumerate(data.strategy.video_concepts, 1):
            report += f"### {idx}. {video.title}\n\n"
            report += f"{video.description}\n\n"
            report += f"**冒頭フック**: {video.hook}\n\n"
            report += "**主要ポイント**:\n"
            for point in video.key_points:
                report += f"- {point}\n"
            report += f"\n**CTA**: {video.cta}\n"
            report += f"**推奨尺**: {video.estimated_length}\n\n"
            report += "---\n\n"

        return report


# Singleton instance
report_generator = ReportGenerator()
