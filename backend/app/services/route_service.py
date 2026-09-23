import httpx


OSRM_URL = "https://router.project-osrm.org/route/v1/driving"


def _request_route(
    start_lat,
    start_lon,
    end_lat,
    end_lon,
    exclude=None,
):
    """
    Request one routing strategy from OSRM.
    """

    url = (
        f"{OSRM_URL}/"
        f"{start_lon},{start_lat};"
        f"{end_lon},{end_lat}"
    )

    params = {
        "overview": "full",
        "geometries": "geojson",
        "alternatives": 2,
    }

    if exclude:
        params["exclude"] = exclude

    response = httpx.get(
        url,
        params=params,
        timeout=20,
    )

    response.raise_for_status()

    data = response.json()

    if data.get("code") != "Ok":
        raise RuntimeError(
            f"OSRM routing failed: {data.get('code')}"
        )

    return data.get("routes", [])


def _convert_route(route, route_id, strategy):
    """
    Convert OSRM route format into our SafeRoute format.
    """

    return {
        "route_id": route_id,
        "strategy": strategy,
        "distance_km": round(
            route["distance"] / 1000,
            2,
        ),
        "duration_min": round(
            route["duration"] / 60,
            2,
        ),
        "geometry": route["geometry"],
    }


def _geometry_signature(route):
    """
    Create a simple signature so we don't keep duplicate routes.
    """

    coordinates = route["geometry"]["coordinates"]

    if not coordinates:
        return None

    # Use a few points rather than the complete geometry.
    sample_indices = [
        0,
        len(coordinates) // 2,
        len(coordinates) - 1,
    ]

    signature = []

    for index in sample_indices:
        lon, lat = coordinates[index]

        signature.append(
            (
                round(lon, 4),
                round(lat, 4),
            )
        )

    return tuple(signature)


def get_routes(
    start_lat,
    start_lon,
    end_lat,
    end_lon,
):
    """
    Generate multiple candidate routes.

    Strategy 1:
        Normal routing.

    Strategy 2:
        Avoid motorways.

    Strategy 3:
        Avoid motorways and trunk roads.

    The resulting routes are deduplicated.
    """

    candidate_routes = []

    # ---------------------------------------------------------
    # Strategy 1 — Normal / fastest route
    # ---------------------------------------------------------

    try:
        normal_routes = _request_route(
            start_lat,
            start_lon,
            end_lat,
            end_lon,
        )

        for route in normal_routes:
            candidate_routes.append(
                _convert_route(
                    route,
                    f"route-{len(candidate_routes) + 1}",
                    "Fastest",
                )
            )

    except Exception as exc:
        print(
            "Normal routing failed:",
            exc,
        )

    # ---------------------------------------------------------
    # Strategy 2 — Avoid motorways
    # ---------------------------------------------------------

    try:
        no_motorway_routes = _request_route(
            start_lat,
            start_lon,
            end_lat,
            end_lon,
            exclude="motorway",
        )

        for route in no_motorway_routes:
            candidate_routes.append(
                _convert_route(
                    route,
                    f"route-{len(candidate_routes) + 1}",
                    "Avoid motorways",
                )
            )

    except Exception as exc:
        print(
            "No-motorway routing failed:",
            exc,
        )

    # ---------------------------------------------------------
    # Strategy 3 — Avoid motorways + trunk roads
    # ---------------------------------------------------------

    try:
        local_road_routes = _request_route(
            start_lat,
            start_lon,
            end_lat,
            end_lon,
            exclude="motorway,trunk",
        )

        for route in local_road_routes:
            candidate_routes.append(
                _convert_route(
                    route,
                    f"route-{len(candidate_routes) + 1}",
                    "More local roads",
                )
            )

    except Exception as exc:
        print(
            "Local-road routing failed:",
            exc,
        )

    # ---------------------------------------------------------
    # Remove duplicate geometries
    # ---------------------------------------------------------

    unique_routes = []
    seen_signatures = set()

    for route in candidate_routes:
        signature = _geometry_signature(route)

        if signature is None:
            continue

        if signature in seen_signatures:
            continue

        seen_signatures.add(signature)

        unique_routes.append(route)

    # ---------------------------------------------------------
    # Keep at most 3 routes
    # ---------------------------------------------------------

    unique_routes = unique_routes[:3]

    # Re-number route IDs after deduplication.
    for index, route in enumerate(
        unique_routes,
        start=1,
    ):
        route["route_id"] = f"route-{index}"

    print(
        "SafeRoute generated",
        len(unique_routes),
        "unique candidate routes:",
        [
            {
                "route_id": route["route_id"],
                "strategy": route["strategy"],
                "distance_km": route["distance_km"],
                "duration_min": route["duration_min"],
            }
            for route in unique_routes
        ],
    )

    return unique_routes