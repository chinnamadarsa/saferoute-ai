from typing import Any


def route_tool(routes: list[dict[str, Any]]):
    return routes


def weather_tool(weather: dict[str, Any]):
    return weather


def risk_tool(routes: list[dict[str, Any]]):
    return [
        {
            "route_id": route["route_id"],
            "risk_score": route["risk_score"],
            "flood_risk": route["flood_risk"],
            "disruption_risk": route["disruption_risk"],
            "terrain_elevation": route["terrain_elevation"],
        }
        for route in routes
    ]