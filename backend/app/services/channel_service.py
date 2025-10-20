
from typing import List, Optional
import logging

from fastapi import HTTPException, status
from googleapiclient.discovery import build
from supabase import Client

from ..core.config import settings
from ..models.channel import Channel, ChannelCreate, ChannelInDB

logger = logging.getLogger(__name__)

class ChannelService:
    """チャンネル管理サービス"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        if settings.YOUTUBE_API_KEY:
            self.youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)
        else:
            self.youtube = None

    def _get_channel_id_from_url(self, url: str) -> Optional[str]:
        """YouTubeチャンネルURLからチャンネルIDを抽出する"""
        patterns = [
            r'(?:youtube\.com|youtu\.be)/(?:channel/|c/|user/|@)?([^/\?&]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    async def _get_channel_details_from_youtube(self, channel_id: str) -> dict:
        """YouTube APIからチャンネル詳細を取得する"""
        if not self.youtube:
            # モックデータを返す（APIキーがない場合）
            return {
                'title': f"Mock Channel {channel_id}",
                'subscriberCount': 12345
            }
        try:
            response = self.youtube.channels().list(
                part='snippet,statistics',
                id=channel_id
            ).execute()

            if not response.get('items'):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="YouTube channel not found")

            channel_data = response['items'][0]
            return {
                'title': channel_data['snippet']['title'],
                'subscriberCount': int(channel_data['statistics'].get('subscriberCount', 0))
            }
        except Exception as e:
            # ここではAPIエラーをより具体的にハンドリングすることが望ましい
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch from YouTube API: {e}")

    async def create_channel(self, user_id: UUID, channel_create: ChannelCreate) -> ChannelInDB:
        """新しいチャンネルを登録する"""
        channel_identifier = self._get_channel_id_from_url(str(channel_create.channel_url))
        if not channel_identifier:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid YouTube channel URL")

        # @handle の場合はチャンネルIDに変換する必要がある
        # ここでは簡単のため、そのままIDとして扱うが、実際にはsearch APIで変換する

        details = await self._get_channel_details_from_youtube(channel_identifier)

        new_channel_data = {
            'user_id': str(user_id),
            'channel_id': channel_identifier,
            'channel_name': details['title'],
            'channel_url': str(channel_create.channel_url),
            'subscriber_count': details['subscriberCount']
        }

        response = self.supabase.table('channels').insert(new_channel_data).execute()

        if response.get('error'):
            logger.exception("Error creating channel")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create channel: {response['error']['message']}")
        
        created_channel = response.get('data', [])[0]
        return ChannelInDB(**created_channel)

    async def get_channels_by_user(self, user_id: UUID) -> List[Channel]:
        """ユーザーが登録したチャンネル一覧を取得する"""
        response = self.supabase.table('channels').select('*').eq('user_id', str(user_id)).order('created_at', desc=True).execute()
        if response.get('error'):
            logger.exception("Error fetching channels by user")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch channels: {response['error']['message']}")
        
        channels = response.get('data', [])
        return [Channel(**c) for c in channels]

    async def delete_channel(self, user_id: UUID, channel_id: UUID) -> None:
        """チャンネルを削除する"""
        response = self.supabase.table('channels').delete().match({'id': str(channel_id), 'user_id': str(user_id)}).execute()
        
        if response.get('error'):
            logger.exception("Error deleting channel")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete channel: {response['error']['message']}")
        
        # 削除された行がない場合もエラーにはしない（冪等性を保つ）
        return None
