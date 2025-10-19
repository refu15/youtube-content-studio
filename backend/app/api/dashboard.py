from fastapi import APIRouter

from ..models.dashboard import DashboardOverviewRequest, DashboardOverviewResponse
from ..services.dashboard_overview import dashboard_overview_service

router = APIRouter()


@router.post("/overview", response_model=DashboardOverviewResponse)
async def dashboard_overview(
    request: DashboardOverviewRequest,
) -> DashboardOverviewResponse:
    """ダッシュボード向けの集約データを生成"""
    return dashboard_overview_service.generate_overview(request)


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "dashboard"}
