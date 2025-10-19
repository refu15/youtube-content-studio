from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class ChannelBase(BaseModel):
    """チャンネル情報の基本モデル"""

    channel_id: str = Field(..., description="YouTubeチャンネルID")
    channel_name: str = Field(..., description="チャンネル名")
    channel_url: HttpUrl = Field(..., description="チャンネルのURL")
    subscriber_count: Optional[int] = Field(None, description="登録者数")


class ChannelCreate(BaseModel):
    """チャンネル登録用のモデル"""

    channel_url: HttpUrl = Field(..., description="登録するYouTubeチャンネルのURL")


class Channel(ChannelBase):
    """API応答で返すチャンネル情報モデル"""

    id: UUID = Field(..., description="一意の識別子")
    created_at: datetime = Field(..., description="登録日時")
    updated_at: datetime = Field(..., description="最終更新日時")

    class Config:
        orm_mode = True


class ChannelInDB(Channel):
    """データベース内部で扱うチャンネル情報モデル"""

    user_id: UUID = Field(..., description="所有するユーザーのID")
