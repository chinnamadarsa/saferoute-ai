import json
from pathlib import Path


def get_disruptions():
    file_path = (
        Path(__file__).resolve().parents[3]
        / "data"
        / "demo_disruptions.json"
    )

    with open(file_path, "r") as file:
        return json.load(file)