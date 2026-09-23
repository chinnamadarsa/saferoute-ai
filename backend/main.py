from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from urllib.parse import quote
from urllib.request import Request, urlopen

import json
import time

from agent.agent_service import run_agent


app = FastAPI()


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Request model
# ---------------------------------------------------------

class AnalyzeRequest(BaseModel):
    origin: str
    destination: str


# ---------------------------------------------------------
# Simple geocoding cache
# ---------------------------------------------------------

geocode_cache = {}
last_geocode_request = 0.0


# ---------------------------------------------------------
# Convert place name -> coordinates
# ---------------------------------------------------------

def geocode_place(place: str):
    global last_geocode_request

    place = place.strip()

    if not place:
        raise HTTPException(
            status_code=400,
            detail="Location cannot be empty.",
        )

    cache_key = place.lower()

    # Return cached result
    if cache_key in geocode_cache:
        return geocode_cache[cache_key]

    # Keep requests spaced out for the public geocoder
    elapsed = time.time() - last_geocode_request

    if elapsed < 1.1:
        time.sleep(1.1 - elapsed)

    encoded_place = quote(place)

    url = (
        "https://nominatim.openstreetmap.org/search"
        f"?q={encoded_place}"
        "&format=jsonv2"
        "&limit=1"
    )

    request = Request(
        url,
        headers={
            "User-Agent": "SafeRouteAI-Hackathon/1.0"
        },
    )

    try:
        with urlopen(request, timeout=10) as response:
            data = json.loads(
                response.read().decode("utf-8")
            )

        last_geocode_request = time.time()

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Geocoding service failed: {str(exc)}",
        )

    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Location not found: {place}",
        )

    result = {
        "latitude": float(data[0]["lat"]),
        "longitude": float(data[0]["lon"]),
        "display_name": data[0].get(
            "display_name",
            place,
        ),
    }

    geocode_cache[cache_key] = result

    return result


# ---------------------------------------------------------
# Root
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "SafeRoute AI backend is running"
    }


# ---------------------------------------------------------
# Geocoding endpoint
# ---------------------------------------------------------

@app.get("/api/geocode")
def geocode(location: str):
    return geocode_place(location)


# ---------------------------------------------------------
# SafeRoute analysis endpoint
# ---------------------------------------------------------

@app.post("/api/agent/analyze")
def analyze_route(request: AnalyzeRequest):

    # Convert origin name to coordinates
    origin = geocode_place(request.origin)

    # Convert destination name to coordinates
    destination = geocode_place(request.destination)

    # Run the existing SafeRoute AI pipeline
    result = run_agent(
        origin["latitude"],
        origin["longitude"],
        destination["latitude"],
        destination["longitude"],
    )

    # Send locations back to frontend
    result["origin"] = origin
    result["destination"] = destination

    return result