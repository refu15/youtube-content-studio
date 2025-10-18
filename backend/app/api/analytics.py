from fastapi import APIRouter, File, UploadFile, HTTPException
from ..models.analytics import AnalyticsReport
from ..services.csv_analyzer import csv_analyzer

router = APIRouter()


@router.post("/analyze-csv", response_model=AnalyticsReport)
async def analyze_csv(file: UploadFile = File(...)):
    """
    YouTubeアナリティクスCSVを分析

    CSVファイルをアップロードして、チャンネルパフォーマンスの分析と改善提案を取得します。
    """
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

        return report

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV分析に失敗しました: {str(e)}")


@router.get("/health")
async def health_check():
    """API ヘルスチェック"""
    return {"status": "healthy", "service": "analytics"}
