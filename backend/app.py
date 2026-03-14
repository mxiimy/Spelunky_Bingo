from pathlib import Path
import random
import re
import sys

# Ensure the repo root is on the path so bingo_generator can be imported
# whether the app is started from the root or from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from flask import Flask, jsonify, request  # noqa: E402
from flask_cors import CORS  # noqa: E402

from bingo_generator import read_prompts  # noqa: E402


DEFAULT_PROMPTS_FILE = Path(__file__).resolve().parent.parent / "prompts.txt"
AREAS_DIR = Path(__file__).resolve().parent.parent / "prompts" / "areas"
AREA_ORDER = [
    "dwelling",
    "volcana",
    "jungle",
    "tide_pool",
    "ice_caves",
    "neo_babylon",
    "sunken_city",
    "temple",
]


def get_area_files() -> dict[str, Path]:
    area_files: dict[str, Path] = {}

    if AREAS_DIR.exists():
        for file_path in sorted(AREAS_DIR.glob("*.txt")):
            area_files[file_path.stem] = file_path

    if not area_files and DEFAULT_PROMPTS_FILE.exists():
        area_files["default"] = DEFAULT_PROMPTS_FILE

    return area_files


def get_sorted_area_ids(area_files: dict[str, Path]) -> list[str]:
    ordered_area_ids = [area_id for area_id in AREA_ORDER if area_id in area_files]
    remaining_area_ids = sorted(area_id for area_id in area_files if area_id not in AREA_ORDER)
    return ordered_area_ids + remaining_area_ids


def format_area_label(area_id: str) -> str:
    return area_id.replace("_", " ").replace("-", " ").title()


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    @app.get("/api/prompts")
    def get_prompts():
        count = request.args.get("count", default=5, type=int)
        area = request.args.get("area", default="", type=str).strip()

        if count < 1:
            return jsonify({"error": "count must be at least 1"}), 400

        area_files = get_area_files()
        if not area_files:
            return jsonify({"error": "No prompt files found."}), 500

        if area:
            if not re.fullmatch(r"[a-zA-Z0-9_-]+", area):
                return jsonify({"error": "Invalid area id."}), 400
            if area not in area_files:
                return jsonify({"error": f"Unknown area: {area}"}), 400
            selected_area = area
        else:
            selected_area = next(iter(area_files.keys()))

        prompts = read_prompts(area_files[selected_area])
        if len(prompts) < count:
            return (
                jsonify(
                    {
                        "error": (
                            f"Not enough prompts in {selected_area}. "
                            f"Need at least {count}, found {len(prompts)}."
                        )
                    }
                ),
                400,
            )

        selection = random.sample(prompts, count)
        return jsonify({"area": selected_area, "prompts": selection})

    @app.get("/api/areas")
    def get_areas():
        area_files = get_area_files()
        areas = [
            {"id": area_id, "label": format_area_label(area_id)}
            for area_id in get_sorted_area_ids(area_files)
        ]
        return jsonify({"areas": areas})

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
