"""
Reminder-checking logic, triggered by an external daily cron hitting
POST /api/internal/send-reminders (see reminders_router.py).

Kept separate from the router so the core "who needs a reminder today"
logic is testable without spinning up FastAPI or hitting a real database.
"""
from datetime import date, timedelta

REMINDER_WINDOW_DAYS = 7


def _parse_date(d):
    if isinstance(d, str):
        return date.fromisoformat(d)
    return d


def find_due_vaccines(vaccines: list[dict], today: date = None) -> list[dict]:
    """
    Returns vaccines with next_due_date within REMINDER_WINDOW_DAYS from
    today (inclusive), that have NOT already had a reminder sent
    (last_reminder_sent_at is null/None).

    Once a vaccine's next_due_date is updated (e.g. renewed after a vet
    visit), last_reminder_sent_at should be reset to null by whatever code
    updates that record, so a new reminder cycle can begin for the new date.
    """
    today = today or date.today()
    cutoff = today + timedelta(days=REMINDER_WINDOW_DAYS)

    due = []
    for v in vaccines:
        due_date = _parse_date(v["next_due_date"])
        already_reminded = v.get("last_reminder_sent_at") is not None
        if today <= due_date <= cutoff and not already_reminded:
            due.append(v)
    return due


def find_due_vet_visits(vet_visits: list[dict], today: date = None) -> list[dict]:
    """
    Same logic as find_due_vaccines, but for vet_visits.next_due_date
    (only visits that actually have a next_due_date set are considered).
    """
    today = today or date.today()
    cutoff = today + timedelta(days=REMINDER_WINDOW_DAYS)

    due = []
    for v in vet_visits:
        if not v.get("next_due_date"):
            continue
        due_date = _parse_date(v["next_due_date"])
        already_reminded = v.get("last_reminder_sent_at") is not None
        if today <= due_date <= cutoff and not already_reminded:
            due.append(v)
    return due


def build_reminder_email(dog_name: str, items: list[dict], item_type: str) -> tuple[str, str]:
    """
    Builds (subject, html_body) for a reminder email covering one or more
    due items for a single dog. item_type is 'vaccine' or 'vet visit'.
    """
    if item_type == "vaccine":
        subject = f"Reminder: {dog_name} has {len(items)} vaccine(s) due soon"
        rows = "".join(
            f"<li><strong>{v['vaccine_name']}</strong> — due {v['next_due_date']}</li>"
            for v in items
        )
        body = f"""
        <p>Hi there,</p>
        <p>This is a reminder that <strong>{dog_name}</strong> has upcoming vaccine(s) due within the next {REMINDER_WINDOW_DAYS} days:</p>
        <ul>{rows}</ul>
        <p>Please schedule a vet visit if you haven't already.</p>
        <p>— PawCare</p>
        """
    else:
        subject = f"Reminder: {dog_name} has an upcoming vet visit"
        rows = "".join(
            f"<li>{v.get('reason', 'Vet visit')} — due {v['next_due_date']}</li>"
            for v in items
        )
        body = f"""
        <p>Hi there,</p>
        <p>This is a reminder that <strong>{dog_name}</strong> has an upcoming vet visit due within the next {REMINDER_WINDOW_DAYS} days:</p>
        <ul>{rows}</ul>
        <p>— PawCare</p>
        """
    return subject, body