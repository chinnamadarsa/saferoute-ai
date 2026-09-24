from app.services.gemini_service import generate_route_explanation
from app.services.route_analysis_service import analyze_routes
from agent.state import SafeRouteState


def analyze_trip(state: SafeRouteState):
    result = analyze_routes(
        state["start_lat"],
        state["start_lon"],
        state["end_lat"],
        state["end_lon"]
    )

    return {
        "routes": result["routes"],
        "weather": result["weather"]
    }
def select_route(state: SafeRouteState):
    routes = state["routes"]

    if not routes:
        return {
            "selected_route": {}
        }

    selected = min(
        routes,
        key=lambda route: route["risk_score"]
    )

    return {
        "selected_route": selected
    }
def explain_route(state: SafeRouteState):
    route = state["selected_route"]

    explanation = generate_route_explanation(route)

    return {
        "explanation": explanation
    }