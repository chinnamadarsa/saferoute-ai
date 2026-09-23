import httpx


OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def get_weather(latitude, longitude):
    """
    Get weather for a single location.

    This function is kept for compatibility with the existing code.
    """

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,precipitation,rain,weather_code",
        "hourly": "precipitation,rain",
        "forecast_hours": 6,
        "timezone": "auto",
    }

    response = httpx.get(
        OPEN_METEO_URL,
        params=params,
        timeout=10,
    )

    response.raise_for_status()

    data = response.json()

    return {
        "latitude": latitude,
        "longitude": longitude,
        "temperature": data["current"]["temperature_2m"],
        "precipitation": data["current"]["precipitation"],
        "rainfall": data["current"]["rain"],
        "weather_code": data["current"]["weather_code"],
        "rainfall_unit": "mm",
        "forecast": data["hourly"],
        "source": "Open-Meteo",
    }


def _sample_route_points(geometry, sample_count=6):
    """
    Pick a small number of points along a GeoJSON LineString.

    GeoJSON coordinates are:
        [longitude, latitude]
    """

    if not geometry:
        return []

    coordinates = geometry.get("coordinates", [])

    if not coordinates:
        return []

    if len(coordinates) <= sample_count:
        selected = coordinates
    else:
        indices = []

        for i in range(sample_count):
            index = round(
                i * (len(coordinates) - 1) / (sample_count - 1)
            )
            indices.append(index)

        selected = [coordinates[i] for i in indices]

    points = []

    for index, coordinate in enumerate(selected, start=1):
        longitude = coordinate[0]
        latitude = coordinate[1]

        points.append(
            {
                "point": index,
                "latitude": latitude,
                "longitude": longitude,
            }
        )

    return points


def get_route_weather(geometry, sample_count=6):
    """
    Get weather at several points along a route.

    This makes the weather route-aware instead of checking
    only the origin.
    """

    points = _sample_route_points(
        geometry,
        sample_count=sample_count,
    )

    if not points:
        return {
            "source": "Open-Meteo",
            "samples": [],
            "summary": {
                "max_rainfall": 0,
                "max_precipitation": 0,
            },
        }

    latitudes = ",".join(
        str(point["latitude"])
        for point in points
    )

    longitudes = ",".join(
        str(point["longitude"])
        for point in points
    )

    params = {
        "latitude": latitudes,
        "longitude": longitudes,
        "current": "temperature_2m,precipitation,rain,weather_code",
        "timezone": "auto",
    }

    response = httpx.get(
        OPEN_METEO_URL,
        params=params,
        timeout=15,
    )

    response.raise_for_status()

    data = response.json()

    # Open-Meteo returns a list when multiple coordinates are requested.
    if isinstance(data, dict):
        data = [data]

    samples = []

    for point, weather in zip(points, data):
        samples.append(
            {
                "point": point["point"],
                "latitude": point["latitude"],
                "longitude": point["longitude"],
                "temperature": weather["current"]["temperature_2m"],
                "precipitation": weather["current"]["precipitation"],
                "rainfall": weather["current"]["rain"],
                "weather_code": weather["current"]["weather_code"],
            }
        )

    rainfall_values = [
        sample["rainfall"]
        for sample in samples
        if sample["rainfall"] is not None
    ]

    precipitation_values = [
        sample["precipitation"]
        for sample in samples
        if sample["precipitation"] is not None
    ]

    temperature_values = [
        sample["temperature"]
        for sample in samples
        if sample["temperature"] is not None
    ]

    return {
        "source": "Open-Meteo",
        "sample_count": len(samples),
        "samples": samples,
        "summary": {
            "max_rainfall": max(rainfall_values)
            if rainfall_values
            else 0,
            "max_precipitation": max(precipitation_values)
            if precipitation_values
            else 0,
            "average_temperature": (
                sum(temperature_values) / len(temperature_values)
                if temperature_values
                else None
            ),
        },
    }