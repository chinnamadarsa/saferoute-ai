from agent.agent_service import run_agent
from fastapi import APIRouter
from app.models.route_models import RouteRequest
from app.services.route_analysis_service import analyze_routes

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/routes/analyze")
def analyze_route(request: RouteRequest):
    return analyze_routes(
        request.start_lat,
        request.start_lon,
        request.end_lat,
        request.end_lon
    )
@router.post("/agent/analyze")
def analyze_with_agent(request: RouteRequest):
    result = run_agent(
        request.start_lat,
        request.start_lon,
        request.end_lat,
        request.end_lon
    )

    return {
        "selected_route": result.get("selected_route"),
        "risk": result.get("selected_route", {}).get("risk_score"),
        "explanation": result.get("explanation"),
        "weather": result.get("weather"),
        "routes": result.get("routes")
    }