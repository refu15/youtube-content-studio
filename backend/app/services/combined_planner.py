import google.generativeai as genai
from ..core.config import settings
from ..models.trends import TrendsAnalysisResponse
from ..models.viral_finder import ViralFinderResponse
from ..models.schemas import VideoConcept, ChannelStrategy, ContentCalendar, PlanningResponse, PersonaInput
import json
from typing import List


class CombinedPlanner:
    """トレンド+バイラル分析から企画案を生成するサービス"""

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    def generate_plan_from_research(
        self,
        trends: TrendsAnalysisResponse,
        viral: ViralFinderResponse,
        channel_genre: str,
        channel_name: str = None
    ) -> PlanningResponse:
        """トレンド分析とバイラル動画の結果から企画案を生成"""

        # トレンドとバイラルのデータをまとめる
        trend_titles = []
        for platform in trends.platforms:
            for video in platform.videos[:3]:
                trend_titles.append(video.title)

        viral_titles = [v.title for v in viral.videos[:5]]
        viral_patterns = viral.insights

        prompt = f"""
以下のトレンド分析とバイラル動画の調査結果を基に、成功する可能性が高いYouTubeチャンネルの企画案を作成してください。

## チャンネルジャンル
{channel_genre}

## トレンド動画（人気コンテンツ）
{chr(10).join(f"- {t}" for t in trend_titles)}

## バイラル動画（登録者少×再生数多）
{chr(10).join(f"- {t}" for t in viral_titles)}

## バイラル動画の成功パターン
{chr(10).join(f"- {p}" for p in viral_patterns)}

## 総合的な戦略提案
{chr(10).join(trends.overall_insights)}

## 指示
上記のデータを分析し、以下のJSON形式で戦略的なチャンネル企画案を作成してください：

{{
  "channel_concept": "トレンドとバイラルパターンを組み合わせたチャンネルコンセプト",
  "unique_value": "差別化ポイント（バイラル要素を取り入れる）",
  "target_audience": "ターゲット視聴者",
  "content_pillars": ["柱1（トレンド要素）", "柱2（バイラル要素）", "柱3", "柱4"],
  "posting_frequency": "推奨投稿頻度",
  "growth_strategy": ["戦略1（トレンドを活用）", "戦略2（バイラル手法）", "戦略3", "戦略4", "戦略5"],
  "video_concepts": [
    {{
      "title": "トレンドとバイラル要素を組み合わせたタイトル",
      "description": "動画の内容",
      "hook": "バイラル動画から学んだ冒頭フック",
      "key_points": ["ポイント1", "ポイント2", "ポイント3"],
      "cta": "Call to Action",
      "estimated_length": "推奨動画尺"
    }}
  ]
}}

※ video_concepts は5つ生成
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

            data = json.loads(response_text)
            strategy = ChannelStrategy(**data)

            # カレンダーも生成
            calendar = self._generate_calendar_from_strategy(strategy, channel_genre)

            return PlanningResponse(
                strategy=strategy,
                calendar=calendar
            )

        except Exception as e:
            print(f"Error generating combined plan: {e}")
            raise

    def _generate_calendar_from_strategy(
        self,
        strategy: ChannelStrategy,
        channel_genre: str
    ) -> List[ContentCalendar]:
        """戦略からカレンダーを生成"""

        prompt = f"""
以下のチャンネル戦略に基づいて、4週間分のコンテンツカレンダーを作成してください。

## チャンネルコンセプト
{strategy.channel_concept}

## コンテンツの柱
{chr(10).join(f"- {p}" for p in strategy.content_pillars)}

## 初期動画コンセプト
{chr(10).join(f"- {v.title}" for v in strategy.video_concepts)}

## 指示
各週に2-3本の動画を配置し、戦略と一貫性のある4週間カレンダーを作成してください。

以下のJSON配列形式で出力：

[
  {{
    "week": 1,
    "theme": "第1週のテーマ",
    "videos": [
      {{
        "title": "動画タイトル",
        "description": "動画の内容",
        "hook": "冒頭フック",
        "key_points": ["ポイント1", "ポイント2", "ポイント3"],
        "cta": "Call to Action",
        "estimated_length": "推奨動画尺"
      }}
    ]
  }}
]

※ すべて日本語
※ JSONのみを返してください
"""

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()

            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            data = json.loads(response_text)
            return [ContentCalendar(**week) for week in data]

        except Exception as e:
            print(f"Error generating calendar: {e}")
            return []


# Singleton instance
combined_planner = CombinedPlanner()
