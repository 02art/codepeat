"""
XP and levelling for CodePeat.

A user earns XP per *distinct* challenge for which a lecturer has accepted one of their
submissions, weighted by the challenge's difficulty. Challenges that do not require grading
(e.g. CodePeat's own) never award XP, since there is no automatic evaluation. Levels use
growing thresholds — advancing from level L to L+1 costs 100·L XP.
"""
from .models.challenge import Challenge
from .models.submission import Submission

# XP awarded per distinct accepted challenge, by difficulty.
DIFFICULTY_XP = {"easy": 10, "medium": 25, "hard": 50}

# Why a submission does (not yet) earn XP — drives the message after the reflection step.
XP_NONE = "none"        # challenge is ungraded → no XP at all
XP_ALREADY = "already"  # the user already earned XP for this challenge
XP_PENDING = "pending"  # XP follows once a lecturer accepts the submission


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
        Challenge.objects.filter(
            requires_grading=True,
            submissions__user=user,
            submissions__status=Submission.StatusChoices.ACCEPTED,
        )
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


def xp_outcome_for(user, challenge, exclude_submission_id=None) -> str:
    """Which XP message applies to a submission: XP_NONE, XP_ALREADY or XP_PENDING."""
    if not challenge.requires_grading:
        return XP_NONE
    earned = challenge.submissions.filter(user=user, status=Submission.StatusChoices.ACCEPTED)
    if exclude_submission_id is not None:
        earned = earned.exclude(id=exclude_submission_id)
    return XP_ALREADY if earned.exists() else XP_PENDING
