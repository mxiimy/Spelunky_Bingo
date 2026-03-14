from pathlib import Path
import random
import sys

# Ensure the repo root is on the path so bingo_generator can be imported
# whether the app is started from the root or from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from flask import Flask, jsonify, request  # noqa: E402
from flask_cors import CORS  # noqa: E402

from bingo_generator import read_prompts  # noqa: E402


DEFAULT_PROMPTS_FILE = Path(__file__).resolve().parent.parent / "prompts.txt"


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    @app.get("/api/prompts")
    def get_prompts():
        count = request.args.get("count", default=5, type=int)
        if count < 1:
            return jsonify({"error": "count must be at least 1"}), 400

        prompts = read_prompts(DEFAULT_PROMPTS_FILE)
        if len(prompts) < count:
            return (
                jsonify(
                    {
                        "error": f"Not enough prompts. Need at least {count}, found {len(prompts)}."
                    }
                ),
                400,
            )

        selection = random.sample(prompts, count)
        return jsonify({"prompts": selection})

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
