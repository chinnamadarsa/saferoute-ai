import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)


def generate_route_explanation(route):
    prompt = f"""
You are SafeRoute AI, a route safety assistant.

Use ONLY the information provided below.

Route ID: {route["route_id"]}
ETA: {route["duration_min"]} minutes
Distance: {route["distance_km"]} km
Estimated risk score: {route["risk_score"]}
Rainfall: {route["rainfall"]} mm
Flood-risk signal: {route["flood_risk"]}
Disruption-risk signal: {route["disruption_risk"]}
Elevation: {route["terrain_elevation"]} meters

Write a short explanation of why this route has its current risk level.
Do not invent traffic, weather, flooding, construction, or other information.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt
        )

        return response.text

    except Exception:
        return (
            f"Route {route['route_id']} has an estimated risk score of "
            f"{route['risk_score']}. "
            f"Rainfall is {route['rainfall']} mm, with a flood-risk signal of "
            f"{route['flood_risk']} and a disruption-risk signal of "
            f"{route['disruption_risk']}. "
            f"The route covers approximately {route['distance_km']} km "
            f"with an estimated travel time of {route['duration_min']} minutes."
        )