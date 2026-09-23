from app.risk.engine import calculate_route_risk
from app.services.route_service import get_routes
from app.services.weather_service import get_route_weather
from app.services.risk_zone_service import get_risk_zones
from app.services.disruption_service import get_disruptions
from app.services.terrain_service import get_elevation


def is_near_route(latitude, longitude, route, threshold=0.003):
    for lon, lat in route["geometry"]["coordinates"]:
        if abs(lat - latitude) <= threshold and abs(lon - longitude) <= threshold:
            return True

    return False


def analyze_routes(start_lat, start_lon, end_lat, end_lon):
    routes = get_routes(
        start_lat,
        start_lon,
        end_lat,
        end_lon
    )

    risk_zones = get_risk_zones()
    disruptions = get_disruptions()
    terrain = get_elevation(start_lat, start_lon)

    analyzed_routes = []
    route_weather_results = []

    for route in routes:

        # Get weather from multiple points along this route.
        route_weather = get_route_weather(
            route["geometry"],
            sample_count=6
        )

        weather_summary = route_weather["summary"]

        # Use the maximum rainfall found anywhere along the route.
        rainfall = weather_summary["max_rainfall"]

        rainfall_risk = min(
            rainfall * 20,
            100
        )

        matched_zones = [
            zone
            for zone in risk_zones
            if is_near_route(
                zone["latitude"],
                zone["longitude"],
                route
            )
        ]

        matched_disruptions = [
            item
            for item in disruptions
            if is_near_route(
                item["latitude"],
                item["longitude"],
                route
            )
        ]

        flood_risk = max(
            [
                zone["risk_level"] * 100
                for zone in matched_zones
            ],
            default=0
        )

        disruption_risk = max(
            [
                item["severity"] * 100
                for item in matched_disruptions
            ],
            default=0
        )

        # Traffic data is not connected yet.
        traffic_risk = 0

        # Elevation is returned as a signal but not scored yet.
        terrain_risk = 0

        risk_score = calculate_route_risk(
            rainfall_risk,
            flood_risk,
            terrain_risk,
            traffic_risk,
            disruption_risk
        )

        analyzed_routes.append({
            **route,

            "risk_score": risk_score,

            # Route-specific rainfall
            "rainfall": rainfall,

            "rainfall_risk": round(rainfall_risk, 2),

            "flood_risk": round(flood_risk, 2),

            "terrain_elevation": terrain["elevation"],

            "traffic_risk": traffic_risk,

            "disruption_risk": round(
                disruption_risk,
                2
            ),

            "risk_zones": matched_zones,

            "disruptions": matched_disruptions,

            # Keep the complete weather information
            # for this particular route.
            "weather": route_weather
        })

        route_weather_results.append({
            "route_id": route["route_id"],
            "weather": route_weather
        })

    # Backwards-compatible top-level weather summary.
    #
    # This lets the current frontend continue using:
    # result.weather.rainfall
    #
    # while the individual route weather remains available
    # inside each route.
    all_rainfall = [
        route["weather"]["summary"]["max_rainfall"]
        for route in analyzed_routes
        if route.get("weather")
    ]

    all_precipitation = [
        route["weather"]["summary"]["max_precipitation"]
        for route in analyzed_routes
        if route.get("weather")
    ]

    all_temperatures = [
        route["weather"]["summary"]["average_temperature"]
        for route in analyzed_routes
        if route.get("weather")
        and route["weather"]["summary"]["average_temperature"] is not None
    ]

    weather = {
        "source": "Open-Meteo",

        "rainfall": max(
            all_rainfall,
            default=0
        ),

        "rainfall_unit": "mm",

        "precipitation": max(
            all_precipitation,
            default=0
        ),

        "temperature": (
            sum(all_temperatures) / len(all_temperatures)
            if all_temperatures
            else None
        ),

        "route_weather": route_weather_results
    }

    return {
        "weather": weather,
        "routes": analyzed_routes
    }