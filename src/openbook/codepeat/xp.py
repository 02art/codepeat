"""
XP and levelling for CodePeat.

A user earns XP for each *distinct* challenge they have submitted to, weighted by the
challenge's difficulty (so re-submitting the same challenge does not farm XP). Levels use
growing thresholds — advancing from level L to L+1 costs 100·L XP — so higher levels take
progressively more effort.
"""
from .models.challenge import Challenge

# XP awarded per distinct completed challenge, by difficulty.
DIFFICULTY_XP = {"easy": 10, "medium": 25, "hard": 50}


def xp_for_difficulty(difficulty: str) -> int:
    return DIFFICULTY_XP.get(difficulty, DIFFICULTY_XP["easy"])


def total_xp_threshold(level: int) -> int:
    """Total XP required to have reached `level` (level 1 starts at 0 XP)."""
    return 50 * (level - 1) * level


def level_for_xp(xp: int) -> int:
    level = 1
    while total_xp_threshold(level + 1) <= xp:
        level += 1
    return level


def progress_for_user(user) -> dict:
    """The user's XP/level snapshot for the profile and the navbar progress bar."""
    difficulties = (
        Challenge.objects.filter(submissions__user=user)
        .distinct()
        .values_list("difficulty", flat=True)
    )
    xp = sum(xp_for_difficulty(d) for d in difficulties)

    level = level_for_xp(xp)
    base = total_xp_threshold(level)
    nxt = total_xp_threshold(level + 1)

    return {
        "xp": xp,
        "level": level,
        "xp_into_level": xp - base,
        "xp_for_next_level": nxt - base,
    }
