from googleapiclient.discovery import build
from datetime import datetime, timedelta
from typing import List
from ..core.config import settings
from ..models.trends import TrendingVideo
import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)


class YouTubeTrendsAnalyzer:
    """YouTube トレンド分析サービス"""

    def __init__(self):
        if settings.YOUTUBE_API_KEY:
            print(f"[DEBUG] YouTube API Key found: {settings.YOUTUBE_API_KEY[:10]}...")
            self.youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)
            print(f"[DEBUG] YouTube API client built successfully")
        else:
            print(f"[DEBUG] No YouTube API Key - using mock data")
            self.youtube = None

        # Gemini for analysis
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        print(f"[DEBUG] Gemini model initialized: gemini-2.0-flash")

    def search_trending_shorts(
        self,
        keywords: List[str],
        max_results: int = 10
    ) -> List[TrendingVideo]:
        """YouTube Shorts のトレンド動画を検索"""

        import sys
        sys.stderr.write(f"[DEBUG] search_trending_shorts called with keywords: {keywords}\n")
        sys.stderr.write(f"[DEBUG] self.youtube is: {self.youtube}\n")
        sys.stderr.flush()

        if not self.youtube:
            # YouTube API キーがない場合は、Geminiで模擬データを生成
            print(f"[DEBUG] No YouTube client - returning mock data")
            return self._generate_mock_youtube_trends(keywords, max_results)

        print(f"[DEBUG] Attempting to call YouTube API...")
        try:
            import random

            # ランダムな日数で期間を変える（30-90日前）
            random_days = random.randint(30, 90)
            time_ago = datetime.utcnow() - timedelta(days=random_days)
            published_after = time_ago.isoformat("T") + "Z"

            # キーワードを組み合わせて検索
            search_query = " OR ".join(keywords) + " #shorts"
            print(f"[DEBUG] Search query: {search_query}")
            print(f"[DEBUG] Published after: {published_after} ({random_days} days ago)")

            # ランダムに並び順を変える
            order_options = ['viewCount', 'relevance', 'date']
            random_order = random.choice(order_options)
            print(f"[DEBUG] Order by: {random_order}")

            # より多くの結果を取得してランダムサンプリング
            fetch_count = min(max_results * 3, 50)  # 最大50件取得

            # YouTube Data API で検索
            print(f"[DEBUG] Calling YouTube API search()...")
            search_response = self.youtube.search().list(
                q=search_query,
                part='id,snippet',
                maxResults=fetch_count,
                order=random_order,
                publishedAfter=published_after,
                type='video',
                videoDuration='short',  # Shorts (< 60秒)
                relevanceLanguage='ja'
            ).execute()
            print(f"[DEBUG] YouTube API search() completed successfully")

            import sys
            items = search_response.get('items', [])
            sys.stderr.write(f"[DEBUG] Search response has {len(items)} items\n")
            sys.stderr.flush()

            # ランダムにサンプリング
            if len(items) > max_results:
                items = random.sample(items, max_results)
                sys.stderr.write(f"[DEBUG] Randomly sampled {max_results} items from {len(search_response.get('items', []))} results\n")
                sys.stderr.flush()

            video_ids = [item['id']['videoId'] for item in items]
            sys.stderr.write(f"[DEBUG] Found {len(video_ids)} video IDs: {video_ids[:3]}...\n")
            sys.stderr.flush()

            if not video_ids:
                sys.stderr.write(f"[DEBUG] No video IDs found - returning empty list\n")
                sys.stderr.flush()
                return []

            # 動画の詳細情報を取得
            sys.stderr.write(f"[DEBUG] Fetching video details for {len(video_ids)} videos...\n")
            sys.stderr.flush()
            videos_response = self.youtube.videos().list(
                part='snippet,statistics,contentDetails',
                id=','.join(video_ids)
            ).execute()
            sys.stderr.write(f"[DEBUG] Video details fetched successfully\n")
            sys.stderr.flush()

            trending_videos = []
            for item in videos_response.get('items', []):
                video = self._parse_youtube_video(item)
                if video:
                    trending_videos.append(video)

            sys.stderr.write(f"[DEBUG] Successfully parsed {len(trending_videos)} videos\n")
            sys.stderr.flush()
            return trending_videos

        except Exception as e:
            import traceback
            import sys
            error_msg = f"Error searching YouTube trends: {e}\nError type: {type(e).__name__}\n"
            sys.stderr.write(f"[ERROR] {error_msg}")
            sys.stderr.write(f"[ERROR] Full traceback:\n")
            sys.stderr.flush()
            traceback.print_exc(file=sys.stderr)
            sys.stderr.flush()
            # エラーの場合も模擬データを返す
            return self._generate_mock_youtube_trends(keywords, max_results)

    def _parse_youtube_video(self, item) -> TrendingVideo:
        """YouTube API レスポンスをパース"""
        snippet = item['snippet']
        statistics = item.get('statistics', {})
        content_details = item.get('contentDetails', {})

        # Gemini でトレンド理由を分析
        why_trending = self._analyze_why_trending(
            snippet.get('title', ''),
            snippet.get('description', ''),
            int(statistics.get('viewCount', 0))
        )

        return TrendingVideo(
            platform="YouTube",
            title=snippet.get('title', ''),
            channel_name=snippet.get('channelTitle', ''),
            video_id=item['id'],
            url=f"https://www.youtube.com/shorts/{item['id']}",
            thumbnail_url=snippet.get('thumbnails', {}).get('high', {}).get('url'),
            view_count=int(statistics.get('viewCount', 0)),
            like_count=int(statistics.get('likeCount', 0)) if 'likeCount' in statistics else None,
            comment_count=int(statistics.get('commentCount', 0)) if 'commentCount' in statistics else None,
            published_at=snippet.get('publishedAt', ''),
            duration=content_details.get('duration', ''),
            tags=snippet.get('tags', []),
            description=snippet.get('description', ''),
            why_trending=why_trending
        )

    def _analyze_why_trending(self, title: str, description: str, views: int) -> str:
        """Gemini を使ってトレンド理由を分析"""
        prompt = f"""
以下のYouTube Shorts動画がトレンドになっている理由を1-2文で簡潔に分析してください。

タイトル: {title}
再生回数: {views:,}回

分析ポイント:
- タイトルの訴求ポイント
- トレンドのテーマやトピック
- 視聴者の興味を引く要素

日本語で簡潔に回答してください。
"""
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            return f"視聴者の関心を集めている人気コンテンツです"

    def _generate_mock_youtube_trends(self, keywords: List[str], max_results: int) -> List[TrendingVideo]:
        """模擬的なYouTubeトレンドデータを生成（API キーがない場合）"""

        prompt = f"""
以下のキーワードに関連する、YouTubeでトレンドになっているShorts動画を{max_results}個、リアルなデータとして生成してください。

キーワード: {', '.join(keywords)}

以下のJSON配列形式で出力してください：

[
  {{
    "title": "動画タイトル（感情を刺激する魅力的なもの）",
    "channel_name": "チャンネル名",
    "view_count": 500000,
    "like_count": 15000,
    "comment_count": 500,
    "published_at": "2025-01-15T10:00:00Z",
    "tags": ["タグ1", "タグ2", "タグ3"],
    "description": "動画の説明",
    "why_trending": "トレンドになっている理由の分析"
  }}
]

※ view_count は10万〜300万の範囲でリアルな数値を設定
※ published_at は過去3ヶ月以内の日付
※ すべて日本語で記述
※ JSONのみを返してください
"""

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()

            # Extract JSON from markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            import json
            data = json.loads(response_text)

            trending_videos = []
            for idx, item in enumerate(data[:max_results]):
                video_id = f"mock_yt_{idx}_{datetime.now().timestamp()}"
                trending_videos.append(TrendingVideo(
                    platform="YouTube",
                    title=item.get('title', ''),
                    channel_name=item.get('channel_name', ''),
                    video_id=video_id,
                    url=f"https://www.youtube.com/shorts/{video_id}",
                    thumbnail_url="https://via.placeholder.com/640x360",
                    view_count=item.get('view_count', 100000),
                    like_count=item.get('like_count'),
                    comment_count=item.get('comment_count'),
                    published_at=item.get('published_at', datetime.utcnow().isoformat() + "Z"),
                    tags=item.get('tags', []),
                    description=item.get('description', ''),
                    why_trending=item.get('why_trending', 'トレンドコンテンツ')
                ))

            return trending_videos

        except Exception as e:
            print(f"Error generating mock YouTube trends: {e}")
            return []


# Singleton instance
youtube_trends_analyzer = YouTubeTrendsAnalyzer()
