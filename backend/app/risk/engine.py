def calculate_route_risk(
    rainfall,
    flood_risk,
    terrain_risk,
    traffic_risk,
    disruption_risk
):
    risk = (
        rainfall * 0.25
        + flood_risk * 0.30
        + terrain_risk * 0.15
        + traffic_risk * 0.15
        + disruption_risk * 0.15
    )

    return round(risk, 2)