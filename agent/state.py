from typing import TypedDict, Any


class SafeRouteState(TypedDict, total=False):
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    routes: list[dict[str, Any]]
    weather: dict[str, Any]
    selected_route: dict[str, Any]
    explanation: str