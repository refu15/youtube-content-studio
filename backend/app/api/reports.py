from fastapi import APIRouter, Response, File, UploadFile, HTTPException
from fastapi.responses import PlainTextResponse
from ..services.report_generator import report_generator
from ..models.trends import TrendingAnalysisRequest
from ..models.viral_finder import ViralFinderRequest
from ..models.schemas import ChannelStrategyRequest
from ..services.trend_analyzer import trend_analyzer
from ..services.viral_finder import viral_finder
from ..services.combined_planner import combined_planner
from ..services.csv_analyzer import csv_analyzer
from ..services.ai_planner import ai_planner

router = APIRouter()


@router.post("/trends-markdown")
async def generate_trends_markdown(request: TrendingAnalysisRequest):
    """トレンド分析のMarkdownレポートを生成"""
    result = trend_analyzer.analyze_trends(
        keywords=request.persona_keywords,
        platforms=request.platforms,
        max_results_per_platform=request.max_results_per_platform
    )
    markdown = report_generator.generate_trends_report(result)
    return PlainTextResponse(content=markdown, media_type="text/markdown")


@router.post("/viral-markdown")
async def generate_viral_markdown(request: ViralFinderRequest):
    """バイラル動画のMarkdownレポートを生成"""
    result = viral_finder.find_viral_videos(
        keywords=request.keywords,
        min_viral_ratio=request.min_viral_ratio,
        max_subscribers=request.max_subscribers,
        platforms=request.platforms,
        max_results=request.max_results
    )
    markdown = report_generator.generate_viral_report(result)
    return PlainTextResponse(content=markdown, media_type="text/markdown")


@router.post("/combined-plan")
async def generate_combined_plan(
    trends_request: TrendingAnalysisRequest,
    viral_request: ViralFinderRequest,
    channel_genre: str,
    channel_name: str = None
):
    """トレンド+バイラル分析から企画案を生成"""

    # トレンド分析
    trends = trend_analyzer.analyze_trends(
        keywords=trends_request.persona_keywords,
        platforms=trends_request.platforms,
        max_results_per_platform=trends_request.max_results_per_platform
    )

    # バイラル動画検索
    viral = viral_finder.find_viral_videos(
        keywords=viral_request.keywords,
        min_viral_ratio=viral_request.min_viral_ratio,
        max_subscribers=viral_request.max_subscribers,
        platforms=viral_request.platforms,
        max_results=viral_request.max_results
    )

    # 組み合わせて企画案生成
    plan = combined_planner.generate_plan_from_research(
        trends=trends,
        viral=viral,
        channel_genre=channel_genre,
        channel_name=channel_name
    )

    return plan


@router.post("/analytics-markdown")
async def generate_analytics_markdown(file: UploadFile = File(...)):
    """CSV分析のMarkdownレポートを生成"""
    try:
        # Check file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="CSVファイルのみアップロード可能です")

        # Read file content
        contents = await file.read()

        if not contents:
            raise HTTPException(status_code=400, detail="ファイルが空です")

        # Analyze CSV
        report = csv_analyzer.analyze_csv(contents)

        # Generate markdown
        markdown = report_generator.generate_analytics_report(report)
        return PlainTextResponse(content=markdown, media_type="text/markdown")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"レポート生成に失敗しました: {str(e)}")


@router.post("/planning-markdown")
async def generate_planning_markdown(request: ChannelStrategyRequest):
    """AI企画案のMarkdownレポートを生成"""
    result = ai_planner.generate_full_plan(request)
    markdown = report_generator.generate_planning_report(result)
    return PlainTextResponse(content=markdown, media_type="text/markdown")


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "reports"}
