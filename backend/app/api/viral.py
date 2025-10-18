from fastapi import APIRouter, HTTPException
from ..models.viral_finder import ViralFinderRequest, ViralFinderResponse
from ..services.viral_finder import viral_finder

router = APIRouter()


@router.post("/find", response_model=ViralFinderResponse)
async def find_viral_videos(request: ViralFinderRequest):
    """
    バイラルポテンシャルのある動画を検索

    登録者数が少ないのに再生数が多い動画を見つけて分析します。
    """
    try:
        result = viral_finder.find_viral_videos(
            keywords=request.keywords,
            min_viral_ratio=request.min_viral_ratio,
            max_subscribers=request.max_subscribers,
            platforms=request.platforms,
            max_results=request.max_results
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"バイラル動画検索に失敗しました: {str(e)}")


@router.get("/health")
async def health_check():
    """API ヘルスチェック"""
    return {"status": "healthy", "service": "viral"}
