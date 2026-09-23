import httpx


def get_elevation(latitude, longitude):
    url = "https://api.open-meteo.com/v1/elevation"

    params = {
        "latitude": latitude,
        "longitude": longitude
    }

    response = httpx.get(url, params=params, timeout=10)
    response.raise_for_status()

    data = response.json()

    return {
        "latitude": latitude,
        "longitude": longitude,
        "elevation": data["elevation"][0],
        "unit": "meters",
        "source": "Open-Meteo"
    }