import google.generativeai as genai
from ..core.config import settings
from ..models.schemas import (
    PersonaInput,
    ChannelStrategy,
    VideoConcept,
    ContentCalendar,
    PlanningResponse
)
import json
from typing import List

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)


class AIPlanner:
    """AI企画案生成サービス"""

    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    def generate_channel_strategy(
        self,
        persona: PersonaInput,
        channel_genre: str,
        channel_name: str = None
    ) -> ChannelStrategy:
        """チャンネル戦略を生成"""

        prompt = f"""
あなたは日本のYouTubeチャンネル戦略の専門家です。以下のペルソナ情報に基づいて、日本市場で成功する戦略的なチャンネル企画案を提案してください。

## ペルソナ情報
- 年齢層: {persona.age_range}
- 性別: {persona.gender}
- 興味関心: {', '.join(persona.interests)}
- 悩み・課題: {', '.join(persona.pain_points)}
- 目標: {', '.join(persona.goals)}
- コンテンツの好み: {persona.content_preferences}

## チャンネルジャンル
{channel_genre}

## 指示
以下のJSON形式で、戦略的なチャンネル企画案を作成してください。特に、日本市場の特性や視聴者の行動パターンを考慮し、具体的なアクションプランを含めてください：

{{
  "channel_concept": "チャンネルの核となるコンセプト（1-2文）",
  "unique_value": "日本市場における他のチャンネルとの差別化ポイント",
  "target_audience": "ターゲット視聴者の具体的な描写（日本の視聴者の特徴を考慮）",
  "content_pillars": ["柱1", "柱2", "柱3", "柱4"],
  "posting_frequency": "推奨投稿頻度と理由（日本の視聴習慣を考慮）",
  "growth_strategy": ["戦略1（具体的な日本のプロモーション方法など）", "戦略2", "戦略3", "戦略4", "戦略5"],
  "video_concepts": [
    {{
      "title": "動画タイトル（クリックされやすいもの）",
      "description": "動画の内容説明",
      "hook": "最初の5秒で視聴者を引き込むフック",
      "key_points": ["ポイント1", "ポイント2", "ポイント3"],
      "cta": "視聴者に促す行動",
      "estimated_length": "推奨動画尺"
    }}
  ]
}}

※ video_concepts は5つの初期動画アイデアを含めてください。
※ すべて日本語で記述してください。
※ JSONのみを返してください。説明文は不要です。
"""

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()

            # Extract JSON from markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            data = json.loads(response_text)
            return ChannelStrategy(**data)

        except Exception as e:
            print(f"Error generating strategy: {e}")
            raise

    def generate_video_concepts(
        self,
        persona: PersonaInput,
        channel_genre: str,
        video_count: int = 5
    ) -> List[VideoConcept]:
        """動画コンセプトを生成"""

        prompt = f"""
あなたはYouTubeコンテンツクリエイターの専門家です。以下のペルソナに最適な動画コンセプトを{video_count}個提案してください。

## ペルソナ情報
- 年齢層: {persona.age_range}
- 性別: {persona.gender}
- 興味関心: {', '.join(persona.interests)}
- 悩み・課題: {', '.join(persona.pain_points)}
- 目標: {', '.join(persona.goals)}
- コンテンツの好み: {persona.content_preferences}

## チャンネルジャンル
{channel_genre}

## 指示
以下のJSON配列形式で、{video_count}個の動画コンセプトを作成してください：

[
  {{
    "title": "クリックされやすい魅力的なタイトル",
    "description": "動画の内容（2-3文）",
    "hook": "最初の5秒で視聴者を引き込むフレーズ",
    "key_points": ["伝えるポイント1", "ポイント2", "ポイント3"],
    "cta": "動画の最後に促す行動",
    "estimated_length": "推奨動画尺（例：8-10分）"
  }}
]

※ すべて日本語で記述してください。
※ タイトルは感情を刺激し、具体的な数字や利益を含めてください。
※ JSONのみを返してください。説明文は不要です。
"""

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()

            # Extract JSON from markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            data = json.loads(response_text)
            return [VideoConcept(**concept) for concept in data]

        except Exception as e:
            print(f"Error generating video concepts: {e}")
            raise

    def generate_content_calendar(
        self,
        persona: PersonaInput,
        channel_genre: str,
        weeks: int = 4
    ) -> List[ContentCalendar]:
        """コンテンツカレンダーを生成（4週間分）"""

        prompt = f"""
あなたはYouTubeコンテンツカレンダーの専門家です。以下のペルソナに基づいて、{weeks}週間分のコンテンツカレンダーを作成してください。

## ペルソナ情報
- 年齢層: {persona.age_range}
- 性別: {persona.gender}
- 興味関心: {', '.join(persona.interests)}
- 悩み・課題: {', '.join(persona.pain_points)}
- 目標: {', '.join(persona.goals)}
- コンテンツの好み: {persona.content_preferences}

## チャンネルジャンル
{channel_genre}

## 指示
各週に2-3本の動画を配置し、週ごとにテーマを設定してください。
以下のJSON配列形式で作成してください：

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

※ すべて日本語で記述してください。
※ 各週のテーマは関連性を持たせ、段階的に視聴者を育成する設計にしてください。
※ JSONのみを返してください。説明文は不要です。
"""

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()

            # Extract JSON from markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            data = json.loads(response_text)
            return [ContentCalendar(**week) for week in data]

        except Exception as e:
            print(f"Error generating content calendar: {e}")
            raise

    def generate_full_plan(
        self,
        persona: PersonaInput,
        channel_genre: str,
        channel_name: str = None
    ) -> PlanningResponse:
        """完全な企画案を生成（戦略 + カレンダー）"""

        # Generate channel strategy
        strategy = self.generate_channel_strategy(persona, channel_genre, channel_name)

        # Generate content calendar
        calendar = self.generate_content_calendar(persona, channel_genre, weeks=4)

        return PlanningResponse(
            strategy=strategy,
            calendar=calendar
        )

    def generate_shooting_materials(
        self,
        video_concept: VideoConcept,
        format: str = "json"
    ) -> str:
        """動画コンセプトから撮影関連資料（構成書）を生成する"""

        if format.lower() not in ["json", "markdown"]:
            raise ValueError("Unsupported format. Choose 'json' or 'markdown'.")

        json_format_description = """
以下のJSON形式で出力してください。各フィールドはオプションであり、関連性の高いもののみを埋めてください。:

{
  "video_title": "動画タイトル",
  "video_concept": "動画のコンセプト概要",
  "target_audience": "ターゲット視聴者",
  "total_estimated_length": "全体の推奨動画尺（例: 5-8分）",
  "scenes": [
    {
      "scene_number": 1,
      "scene_title": "シーンタイトル",
      "estimated_length": "シーンの推奨時間（例: 30秒）",
      "location": "撮影場所（例: 自宅リビング、屋外公園）",
      "visual_description": "視覚的な描写（カメラアングル、動き、背景、登場人物の表情など）",
      "dialogue": "セリフ（誰が何を言うか）",
      "narration": "ナレーション内容",
      "on_screen_text": "画面表示テキスト（テロップ、字幕など）",
      "props_and_costumes": "小道具・衣装",
      "sound_effects": "効果音",
      "background_music": "BGM",
      "notes": "その他特記事項"
    }
  ],
  "call_to_action": "動画全体のCall to Action（例: チャンネル登録、コメント、関連動画視聴）",
  "required_materials": [
    "必要な素材1（例: カメラ、マイク）",
    "必要な素材2（例: 企画書、台本）"
  ],
  "production_notes": "制作上の注意点やヒント"
}
"""

        markdown_format_description = """
以下のMarkdown形式で出力してください。各セクションはオプションであり、関連性の高いもののみを埋めてください。:

# 動画タイトル

## 動画コンセプト
動画のコンセプト概要

## ターゲット視聴者
ターゲット視聴者

## 全体の推奨動画尺
全体の推奨動画尺（例: 5-8分）

## シーン構成

### シーン1: シーンタイトル
- **推奨時間:** シーンの推奨時間（例: 30秒）
- **撮影場所:** 撮影場所（例: 自宅リビング、屋外公園）
- **視覚的描写:** 視覚的な描写（カメラアングル、動き、背景、登場人物の表情など）
- **セリフ:** セリフ（誰が何を言うか）
- **ナレーション:** ナレーション内容
- **画面表示テキスト:** 画面表示テキスト（テロップ、字幕など）
- **小道具・衣装:** 小道具・衣装
- **効果音:** 効果音
- **BGM:** BGM
- **特記事項:** その他特記事項

### シーン2: シーンタイトル
...

## Call to Action
動画全体のCall to Action（例: チャンネル登録、コメント、関連動画視聴）

## 必要な素材
- 必要な素材1（例: カメラ、マイク）
- 必要な素材2（例: 企画書、台本）

## 制作上の注意点
制作上の注意点やヒント
"""

        format_description = json_format_description if format.lower() == "json" else markdown_format_description

        prompt = f"""
あなたはYouTube動画制作の専門家です。以下の動画コンセプトに基づいて、日本市場向けの具体的な撮影関連資料（構成書）を作成してください。

## 動画コンセプト
- タイトル: {video_concept.title}
- 説明: {video_concept.description}
- フック: {video_concept.hook}
- 主要ポイント: {', '.join(video_concept.key_points)}
- CTA: {video_concept.cta}
- 推奨尺: {video_concept.estimated_length}

## 指示
上記の動画コンセプトを基に、日本市場の視聴者に響くような構成書を作成してください。

{format_description}

※ すべて日本語で記述してください。
※ JSONまたはMarkdownのみを返してください。説明文は不要です。
"""

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()

            # Extract content from markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```markdown" in response_text:
                response_text = response_text.split("```markdown")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            return response_text

        except Exception as e:
            print(f"Error generating shooting materials: {e}")
            raise


# Singleton instance
ai_planner = AIPlanner()
