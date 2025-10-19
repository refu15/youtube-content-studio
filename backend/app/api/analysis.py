from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..models.analysis import (
    AnalysisRunCreate,
    AnalysisRunListResponse,
    AnalysisRunResponse,
    AnalysisStatsResponse,
    AnalysisType,
)
from ..services.analysis_history import analysis_history_service
from .deps import get_current_user_id

router = APIRouter()


@router.post(
    "/",
    response_model=AnalysisRunResponse,
    status_code=status.HTTP_201_CREATED,
)
async def save_analysis_run(
    payload: AnalysisRunCreate,
    user_id: str = Depends(get_current_user_id),
) -> AnalysisRunResponse:
    """Persist an analysis result for later review."""
    try:
        return analysis_history_service.save_run(user_id=user_id, payload=payload)
    except Exception as exc:  # noqa: BLE001 - surface as 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"分析結果の保存に失敗しました: {exc}",
        ) from exc


@router.get("/", response_model=AnalysisRunListResponse)
async def list_analysis_runs(
    analysis_type: AnalysisType | None = Query(
        default=None, description="Filter by analysis type if specified"
    ),
    limit: int = Query(default=10, ge=1, le=50),
    cursor: str | None = Query(
        default=None,
        description="Fetch records created before this ISO timestamp",
    ),
    user_id: str = Depends(get_current_user_id),
) -> AnalysisRunListResponse:
    """Return paginated analysis history for the authenticated user."""
    return analysis_history_service.list_runs(
        user_id=user_id,
        analysis_type=analysis_type,
        limit=limit,
        cursor=cursor,
    )


@router.get("/stats", response_model=AnalysisStatsResponse)
async def get_analysis_stats(
    user_id: str = Depends(get_current_user_id),
) -> AnalysisStatsResponse:
    """Return aggregated stats for analysis history."""
    return analysis_history_service.get_stats(user_id=user_id)


@router.get("/{analysis_id}", response_model=AnalysisRunResponse)
async def get_analysis_run(
    analysis_id: str,
    user_id: str = Depends(get_current_user_id),
) -> AnalysisRunResponse:
    """Return a single analysis run."""
    try:
        return analysis_history_service.get_run(user_id=user_id, analysis_id=analysis_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析結果が見つかりませんでした",
        ) from exc


@router.delete(
    "/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_analysis_run(
    analysis_id: str,
    user_id: str = Depends(get_current_user_id),
) -> None:
    """Delete an analysis run."""
    try:
        analysis_history_service.delete_run(user_id=user_id, analysis_id=analysis_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析結果が見つかりませんでした",
        ) from exc
