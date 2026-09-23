from agent.graph import graph


def run_agent(start_lat, start_lon, end_lat, end_lon):
    state = {
        "start_lat": start_lat,
        "start_lon": start_lon,
        "end_lat": end_lat,
        "end_lon": end_lon,
    }

    result = graph.invoke(state)

    return result