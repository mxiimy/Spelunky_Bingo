import argparse
import random
import sys
from pathlib import Path


BOARD_SIZE = 5


def read_prompts(path: Path) -> list[str]:
    if not path.exists():
        raise ValueError(f"Prompt file not found: {path}")

    prompts = [line.strip() for line in path.read_text(encoding="utf-8").splitlines()]
    prompts = [prompt for prompt in prompts if prompt]

    if not prompts:
        raise ValueError("Prompt file is empty after removing blank lines.")

    unique_prompts = list(dict.fromkeys(prompts))
    return unique_prompts


def build_board(prompts: list[str], seed: int | None = None, free_center: bool = True) -> list[str]:
    total_squares = BOARD_SIZE * BOARD_SIZE
    needed_prompts = total_squares - 1 if free_center else total_squares

    if len(prompts) < needed_prompts:
        raise ValueError(
            f"Need at least {needed_prompts} unique prompts, but found {len(prompts)}."
        )

    rng = random.Random(seed)
    selected = rng.sample(prompts, needed_prompts)

    if free_center:
        center_index = total_squares // 2
        selected.insert(center_index, "FREE")

    return selected


def format_board(board: list[str]) -> str:
    rows = [board[i : i + BOARD_SIZE] for i in range(0, len(board), BOARD_SIZE)]
    col_widths = [
        max(len(str(rows[row_index][col_index])) for row_index in range(BOARD_SIZE))
        for col_index in range(BOARD_SIZE)
    ]

    row_lines = []
    for row in rows:
        cells = [f" {cell:<{col_widths[index]}} " for index, cell in enumerate(row)]
        row_lines.append("|" + "|".join(cells) + "|")

    separator = "+" + "+".join("-" * (width + 2) for width in col_widths) + "+"
    lines = [separator]
    for row_line in row_lines:
        lines.append(row_line)
        lines.append(separator)

    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a 5x5 bingo board from a text file (one prompt per line)."
    )
    parser.add_argument("prompt_file", type=Path, help="Path to input prompt text file.")
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Optional random seed for reproducible boards.",
    )
    parser.add_argument(
        "--no-free-center",
        action="store_true",
        help="Use prompts for all 25 squares (disables FREE center).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        prompts = read_prompts(args.prompt_file)
        board = build_board(
            prompts=prompts,
            seed=args.seed,
            free_center=not args.no_free_center,
        )
        print(format_board(board))
        return 0
    except ValueError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
