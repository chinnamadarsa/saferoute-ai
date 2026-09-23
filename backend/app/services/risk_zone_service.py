import json
from pathlib import Path


def get_risk_zones():
    file_path = (
        Path(__file__).resolve().parents[3]
        / "data"
        / "demo_risk_zones.json"
    )

    with open(file_path, "r") as file:
        return json.load(file)