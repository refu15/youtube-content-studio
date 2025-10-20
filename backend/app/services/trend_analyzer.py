from typing import List
from datetime import datetime
import google.generativeai as genai
from ..core.config import settings
from ..models.trends import (
    TrendingVideo,
    PlatformTrends,
    TrendsAnalysisResponse
)
from .youtube_trends import youtube_trends_analyzer


class TrendAnalyzer:
    """全プラットフォームのトレンド分析サービス"""

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    def analyze_trends(
        self,
        keywords: List[str],
        platforms: List[str] = ["YouTube"],
        max_results_per_platform: int = 10
    ) -> TrendsAnalysisResponse:
        """全プラットフォームのトレンドを分析"""

        import sys
        sys.stderr.write(f"[DEBUG] analyze_trends called with keywords: {keywords}\n")
        sys.stderr.write(f"[DEBUG] platforms: {platforms}\n")
        sys.stderr.write(f"[DEBUG] max_results_per_platform: {max_results_per_platform}\n")
        sys.stderr.flush()

        platform_trends = []

        for platform in platforms:
            sys.stderr.write(f"[DEBUG] Processing platform: {platform}\n")
            sys.stderr.flush()
            if platform == "YouTube":
                videos = youtube_trends_analyzer.search_trending_shorts(keywords, max_results_per_platform)
            else:
                continue

            if videos:
                total_views = sum(v.view_count for v in videos)
                insights = self._analyze_platform_insights(platform, videos)

                platform_trends.append(PlatformTrends(
                    platform=platform,
                    videos=videos,
                    total_views=total_views,
                    insights=insights
                ))

        # 全体的な傾向を分析
        overall_insights = self._analyze_overall_insights(platform_trends, keywords)

        return TrendsAnalysisResponse(
            platforms=platform_trends,
            overall_insights=overall_insights,
            analyzed_at=datetime.utcnow().isoformat() + "Z"
        )

    def _analyze_platform_insights(self, platform: str, videos: List[TrendingVideo]) -> List[str]:
        """プラットフォーム別の傾向を分析"""

        if not videos:
            return []

        # 動画データをまとめる
        titles = [v.title for v in videos[:5]]
        avg_views = sum(v.view_count for v in videos) / len(videos)
        all_tags = []
        for v in videos:
            all_tags.extend(v.tags)

        prompt = f"""
{platform}のトレンド動画を分析して、傾向と特徴を3つのポイントにまとめてください。

トップ動画タイトル:
{chr(10).join(f"- {t}" for t in titles)}

平均再生回数: {int(avg_views):,}回

以下の形式で3つの箇条書きで回答してください:
- ポイント1
- ポイント2
- ポイント3

日本語で簡潔に回答してください。
"""

        try:
            response = self.model.generate_content(prompt)
            insights_text = response.text.strip()

            # 箇条書きを抽出
            insights = []
            for line in insights_text.split('\n'):
                line = line.strip()
                if line.startswith('- ') or line.startswith('• ') or line.startswith('* '):
                    insights.append(line[2:].strip())
                elif line and len(insights) < 3:
                    insights.append(line)

            return insights[:3]

        except Exception as e:
            print(f"Error analyzing platform insights: {e}")
            return [
                f"{platform}で人気のコンテンツジャンル",
                "視聴者の関心が高いテーマ",
                "効果的な投稿スタイル"
            ]

    def _analyze_overall_insights(
        self,
        platform_trends: List[PlatformTrends],
        keywords: List[str]
    ) -> List[str]:
        """全体的な傾向とおすすめを分析"""

        if not platform_trends:
            return []

        prompt = f"""
以下のキーワードに関連するトレンド分析結果から、コンテンツ制作のための戦略的な示唆を5つ提案してください。

分析キーワード: {', '.join(keywords)}

プラットフォーム別データ:
"""
        for pt in platform_trends:
            prompt += f"\n{pt.platform}: {len(pt.videos)}本の動画、合計{pt.total_views:,}再生"

        prompt += """

以下の形式で5つの箇条書きで回答してください:
- 示唆1: 具体的なアクション
- 示唆2: 具体的なアクション
- 示唆3: 具体的なアクション
- 示唆4: 具体的なアクション
- 示唆5: 具体的なアクション

日本語で簡潔に、実践的なアドバイスを提供してください。
"""

        try:
            response = self.model.generate_content(prompt)
            insights_text = response.text.strip()

            insights = []
            for line in insights_text.split('\n'):
                line = line.strip()
                if line.startswith('- ') or line.startswith('• ') or line.startswith('* '):
                    insights.append(line[2:].strip())
                elif line and len(insights) < 5:
                    insights.append(line)

            return insights[:5]

        except Exception as e:
            print(f"Error analyzing overall insights: {e}")
            return [
                "プラットフォームごとの特性を活かしたコンテンツ制作",
                "トレンドのテーマを取り入れた動画企画",
                "視聴者の関心に合わせたタイトル・サムネイル最適化",
                "エンゲージメントを高める投稿タイミングの調整",
                "人気クリエイターの成功パターンを参考にする"
            ]


# Singleton instance
trend_analyzer = TrendAnalyzer()
