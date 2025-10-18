from typing import List
from datetime import datetime
import google.generativeai as genai
from ..core.config import settings
from ..models.viral_finder import ViralVideo, ViralFinderResponse


class ViralFinder:
    """バイラルポテンシャルのある動画を見つけるサービス"""

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    def find_viral_videos(
        self,
        keywords: List[str],
        min_viral_ratio: float = 3.0,
        max_subscribers: int = 100000,
        platforms: List[str] = ["YouTube"],
        max_results: int = 20
    ) -> ViralFinderResponse:
        """バイラルポテンシャルのある動画を検索"""

        viral_videos = []

        for platform in platforms:
            if platform == "YouTube":
                videos = self._find_youtube_viral_videos(
                    keywords, min_viral_ratio, max_subscribers, max_results
                )
                viral_videos.extend(videos)

        # バイラル動画の共通パターンを分析
        insights = self._analyze_viral_patterns(viral_videos)
        content_strategies = self._generate_content_strategies(viral_videos, keywords)

        return ViralFinderResponse(
            videos=viral_videos[:max_results],
            insights=insights,
            content_strategies=content_strategies
        )

    def _find_youtube_viral_videos(
        self,
        keywords: List[str],
        min_viral_ratio: float,
        max_subscribers: int,
        max_results: int
    ) -> List[ViralVideo]:
        """YouTube でバイラル動画を検索（模擬データ生成）"""

        prompt = f"""
以下の条件に合う、YouTubeでバイラルになっている動画（登録者数が少ないのに再生数が多い）を{max_results}個生成してください。

検索キーワード: {', '.join(keywords)}
条件:
- チャンネル登録者数: {max_subscribers:,}人以下
- バイラル比率（再生数 ÷ 登録者数）: {min_viral_ratio}倍以上
- 実際にありそうなリアルなデータ

以下のJSON配列形式で出力してください：

[
  {{
    "title": "動画タイトル（バイラルしそうな魅力的なもの）",
    "channel_name": "チャンネル名",
    "subscriber_count": 15000,
    "view_count": 500000,
    "like_count": 25000,
    "comment_count": 1200,
    "published_at": "2025-01-10T10:00:00Z",
    "why_viral": "この動画がバイラルになった理由（具体的に1-2文で）",
    "key_takeaways": ["学べるポイント1", "学べるポイント2", "学べるポイント3"]
  }}
]

※ 登録者数は1,000〜{max_subscribers:,}の範囲
※ 再生数は登録者数の{min_viral_ratio}倍以上
※ バイラル比率が高い順に並べる
※ published_at は過去3ヶ月以内
※ すべて日本語で記述
※ JSONのみを返してください
"""

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()

            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            import json
            data = json.loads(response_text)

            viral_videos = []
            for idx, item in enumerate(data[:max_results]):
                subscriber_count = item.get('subscriber_count', 10000)
                view_count = item.get('view_count', 100000)
                viral_ratio = view_count / subscriber_count if subscriber_count > 0 else 0

                video_id = f"viral_yt_{idx}_{datetime.now().timestamp()}"
                viral_videos.append(ViralVideo(
                    platform="YouTube",
                    title=item.get('title', ''),
                    channel_name=item.get('channel_name', ''),
                    subscriber_count=subscriber_count,
                    view_count=view_count,
                    video_id=video_id,
                    url=f"https://www.youtube.com/watch?v={video_id}",
                    thumbnail_url="https://via.placeholder.com/640x360",
                    like_count=item.get('like_count'),
                    comment_count=item.get('comment_count'),
                    published_at=item.get('published_at', datetime.utcnow().isoformat() + "Z"),
                    viral_ratio=round(viral_ratio, 2),
                    why_viral=item.get('why_viral', 'バイラルコンテンツ'),
                    key_takeaways=item.get('key_takeaways', [])
                ))

            return viral_videos

        except Exception as e:
            print(f"Error finding viral videos: {e}")
            return []

    def _analyze_viral_patterns(self, videos: List[ViralVideo]) -> List[str]:
        """バイラル動画の共通パターンを分析"""

        if not videos:
            return []

        # トップ10のデータを抽出
        top_videos = sorted(videos, key=lambda v: v.viral_ratio, reverse=True)[:10]
        titles = [v.title for v in top_videos]
        avg_ratio = sum(v.viral_ratio for v in top_videos) / len(top_videos)

        prompt = f"""
以下のバイラル動画（登録者数が少ないのに再生数が多い動画）のタイトルを分析して、共通するパターンや特徴を5つのポイントにまとめてください。

バイラル動画タイトル:
{chr(10).join(f"- {t}" for t in titles)}

平均バイラル比率: {avg_ratio:.1f}倍（再生数 ÷ 登録者数）

以下の形式で5つの箇条書きで回答してください:
- パターン1: 具体的な特徴
- パターン2: 具体的な特徴
- パターン3: 具体的な特徴
- パターン4: 具体的な特徴
- パターン5: 具体的な特徴

日本語で簡潔に回答してください。
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
            print(f"Error analyzing viral patterns: {e}")
            return [
                "感情を刺激するタイトル",
                "具体的な数字や期間を含む",
                "視聴者の課題を解決する内容",
                "トレンドのテーマを取り入れている",
                "サムネイルが目を引く"
            ]

    def _generate_content_strategies(
        self,
        videos: List[ViralVideo],
        keywords: List[str]
    ) -> List[str]:
        """バイラル動画から学ぶコンテンツ戦略を生成"""

        if not videos:
            return []

        all_takeaways = []
        for v in videos[:10]:
            all_takeaways.extend(v.key_takeaways)

        prompt = f"""
以下のキーワードでバイラルになった動画の学びから、小規模チャンネルが再生数を伸ばすための具体的なコンテンツ戦略を5つ提案してください。

キーワード: {', '.join(keywords)}

バイラル動画から学べるポイント:
{chr(10).join(f"- {t}" for t in all_takeaways[:15])}

以下の形式で5つの箇条書きで回答してください:
- 戦略1: 具体的なアクションプラン
- 戦略2: 具体的なアクションプラン
- 戦略3: 具体的なアクションプラン
- 戦略4: 具体的なアクションプラン
- 戦略5: 具体的なアクションプラン

日本語で実践的なアドバイスを提供してください。
"""

        try:
            response = self.model.generate_content(prompt)
            strategies_text = response.text.strip()

            strategies = []
            for line in strategies_text.split('\n'):
                line = line.strip()
                if line.startswith('- ') or line.startswith('• ') or line.startswith('* '):
                    strategies.append(line[2:].strip())
                elif line and len(strategies) < 5:
                    strategies.append(line)

            return strategies[:5]

        except Exception as e:
            print(f"Error generating content strategies: {e}")
            return [
                "ニッチなテーマで専門性を打ち出す",
                "視聴者の感情に訴えるストーリーテリング",
                "トレンドを素早く取り入れる",
                "サムネイルとタイトルの最適化",
                "コメント欄でのエンゲージメント強化"
            ]


# Singleton instance
viral_finder = ViralFinder()
