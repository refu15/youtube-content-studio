from fastapi import APIRouter, HTTPException
from ..models.trends import TrendingAnalysisRequest, TrendsAnalysisResponse
from ..services.trend_analyzer import trend_analyzer

router = APIRouter()


@router.post("/analyze", response_model=TrendsAnalysisResponse)
async def analyze_trends(request: TrendingAnalysisRequest):
    """
    トレンド動画を分析

    ペルソナキーワードに基づいて、各プラットフォームのトレンドショート動画を分析します。
    """
    try:
        result = trend_analyzer.analyze_trends(
            keywords=request.persona_keywords,
            platforms=request.platforms,
            max_results_per_platform=request.max_results_per_platform
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"トレンド分析に失敗しました: {str(e)}")


@router.get("/health")
async def health_check():
    """API ヘルスチェック"""
    return {"status": "healthy", "service": "trends"}
