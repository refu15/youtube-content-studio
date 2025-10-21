from typing import List
from datetime import datetime
import logging
import urllib.parse
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from ..core.config import settings
from ..models.viral_finder import ViralVideo, ViralFinderResponse

logger = logging.getLogger(__name__)

class ViralFinder:
    """バイラルポテンシャルのある動画を見つけるサービス"""

    def __init__(self):
        if settings.YOUTUBE_API_KEY:
            self.youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)
        else:
            self.youtube = None
            logger.warning("YOUTUBE_API_KEY is not set. Viral video search will not function.")

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
        """YouTube でバイラル動画を検索"""
        if not self.youtube:
            logger.warning("YouTube API key not configured. Returning empty list for viral videos.")
            return []

        viral_videos: List[ViralVideo] = []
        try:
            # 1. Search for videos based on keywords
            search_response = self.youtube.search().list(
                q=" ".join(keywords),
                type="video",
                part="id,snippet",
                maxResults=min(max_results * 3, 50),  # Fetch more to filter later
                order="viewCount",  # Order by view count to prioritize potentially viral videos
                regionCode="JP", # Focus on Japanese content
                relevanceLanguage="ja"
            ).execute()

            video_ids = [item["id"]["videoId"] for item in search_response.get("items", []) if "videoId" in item["id"]]
            if not video_ids:
                return []

            # 2. Get video statistics
            videos_response = self.youtube.videos().list(
                id=",".join(video_ids),
                part="snippet,statistics"
            ).execute()

            # 3. Get channel statistics for subscriber count
            channel_ids = list(set([item["snippet"]["channelId"] for item in videos_response.get("items", [])]))
            channels_response = self.youtube.channels().list(
                id=",".join(channel_ids),
                part="statistics"
            ).execute()

            channel_stats = {
                item["id"]: int(item["statistics"]["subscriberCount"])
                for item in channels_response.get("items", [])
                if "subscriberCount" in item["statistics"]
            }

            # 4. Filter and process videos
            for item in videos_response.get("items", []):
                video_id = item["id"]
                snippet = item["snippet"]
                statistics = item["statistics"]

                subscriber_count = channel_stats.get(snippet["channelId"], 0)
                view_count = int(statistics.get("viewCount", 0))
                like_count = int(statistics.get("likeCount", 0)) if "likeCount" in statistics else None
                comment_count = int(statistics.get("commentCount", 0)) if "commentCount" in statistics else None

                if subscriber_count == 0:
                    continue # Cannot calculate viral ratio without subscribers

                viral_ratio = view_count / subscriber_count

                if viral_ratio >= min_viral_ratio and subscriber_count <= max_subscribers:
                    # Use Gemini to generate why_viral and key_takeaways
                    # This part still uses Gemini for analysis, as it's a separate AI task
                    # If self.model is completely removed, this part needs a new Gemini client or a dedicated service
                    why_viral = "Geminiによる分析が利用できません。"
                    key_takeaways = []
                    try:
                        if hasattr(self, 'model') and self.model:
                            analysis_prompt = f"""
以下のYouTube動画について、なぜバイラルになったのか（登録者数が少ないのに再生数が多い）を1-2文で簡潔に分析し、この動画から学べるポイントを3つ箇条書きで記述してください。

動画タイトル: {snippet["title"]}
チャンネル名: {snippet["channelTitle"]}
再生回数: {view_count:,}
登録者数: {subscriber_count:,}
バイラル比率: {viral_ratio:.1f}倍

出力形式:
なぜバイラルになったか: [理由]
学べるポイント:
- [ポイント1]
- [ポイント2]
- [ポイント3]
"""
                            analysis_response = self.model.generate_content(analysis_prompt)
                            analysis_text = analysis_response.text.strip()
                            lines = analysis_text.split('\n')
                            for line in lines:
                                if line.startswith("なぜバイラルになったか:"):
                                    why_viral = line.replace("なぜバイラルになったか:", "").strip()
                                elif line.startswith("- "):
                                    key_takeaways.append(line.replace("- ", "").strip())
                        else:
                            logger.warning("Gemini model not available for viral video analysis.")
                    except Exception as e:
                        logger.error(f"Error generating viral analysis with Gemini: {e}")


                    viral_videos.append(ViralVideo(
                        platform="YouTube",
                        title=snippet["title"],
                        channel_name=snippet["channelTitle"],
                        subscriber_count=subscriber_count,
                        view_count=view_count,
                        video_id=video_id,
                        url=f"https://www.youtube.com/watch?v={video_id}",
                        thumbnail_url=snippet["thumbnails"]["high"]["url"] if "high" in snippet["thumbnails"] else None,
                        like_count=like_count,
                        comment_count=comment_count,
                        published_at=snippet["publishedAt"],
                        viral_ratio=round(viral_ratio, 2),
                        why_viral=why_viral,
                        key_takeaways=key_takeaways
                    ))
            
            # Sort by viral ratio in descending order
            viral_videos.sort(key=lambda v: v.viral_ratio, reverse=True)

            return viral_videos[:max_results]

        except HttpError as e:
            logger.error(f"YouTube API error in viral video search: {e}")
            return []
        except Exception as e:
            logger.error(f"Error finding YouTube viral videos: {e}")
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
以下の日本のバイラル動画（登録者数が少ないのに再生数が多い動画）のタイトルを分析して、共通するパターンや特徴を5つのポイントにまとめてください。

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
以下のキーワードで日本でバイラルになった動画の学びから、小規模チャンネルが再生数を伸ばすための具体的なコンテンツ戦略を5つ提案してください。

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
