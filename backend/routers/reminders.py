"""
Internal endpoint for triggering the daily reminder check.

Meant to be called by an external cron service (e.g. cron-job.org, GitHub
Actions scheduled workflow) once per day -- NOT by the frontend or any
user-facing flow. Protected by a shared secret since it iterates over
every dog in the system and sends emails; anyone who could call this
without auth could spam every user or trigger it excessively.
"""
from fastapi import APIRouter, Header, HTTPException
from auth import get_supabase
from email_sender import send_email
from reminder_logic import find_due_vaccines, find_due_vet_visits, build_reminder_email
import os

router = APIRouter()

REMINDER_CRON_SECRET = os.getenv("REMINDER_CRON_SECRET")


def _verify_cron_secret(x_cron_secret: str = Header(None)):
    if not REMINDER_CRON_SECRET:
        raise HTTPException(
            status_code=500,
            detail="REMINDER_CRON_SECRET not configured on the server -- refusing to run.",
        )
    if x_cron_secret != REMINDER_CRON_SECRET:
        raise HTTPException(status_code=403, detail="Invalid or missing cron secret.")


@router.post("/internal/send-reminders")
async def send_reminders(x_cron_secret: str = Header(None)):
    _verify_cron_secret(x_cron_secret)

    supabase = get_supabase()

    # Fetch all dogs with their owner's email (join through users table).
    # NOTE: adjust this query to match your actual Supabase schema/relations
    # -- this assumes dogs.user_id -> users.id -> users.email.
    dogs_res = supabase.table("dogs").select("id, name, user_id").execute()
    dogs = dogs_res.data or []

    results = {"emails_sent": 0, "emails_failed": 0, "details": []}

    for dog in dogs:
        user_res = (
            supabase.table("users")
            .select("email")
            .eq("id", dog["user_id"])
            .single()
            .execute()
        )
        if not user_res.data or not user_res.data.get("email"):
            continue
        owner_email = user_res.data["email"]

        vaccines_res = (
            supabase.table("vaccines").select("*").eq("dog_id", dog["id"]).execute()
        )
        due_vaccines = find_due_vaccines(vaccines_res.data or [])

        vet_visits_res = (
            supabase.table("vet_visits").select("*").eq("dog_id", dog["id"]).execute()
        )
        due_visits = find_due_vet_visits(vet_visits_res.data or [])

        if due_vaccines:
            subject, body = build_reminder_email(dog["name"], due_vaccines, "vaccine")
            send_result = send_email(owner_email, subject, body)
            if send_result["success"]:
                results["emails_sent"] += 1
                # Mark these vaccines as reminded so tomorrow's run skips them
                for v in due_vaccines:
                    supabase.table("vaccines").update(
                        {"last_reminder_sent_at": "now()"}
                    ).eq("id", v["id"]).execute()
            else:
                results["emails_failed"] += 1
            results["details"].append(
                {"dog": dog["name"], "type": "vaccine", "sent": send_result["success"]}
            )

        if due_visits:
            subject, body = build_reminder_email(dog["name"], due_visits, "vet_visit")
            send_result = send_email(owner_email, subject, body)
            if send_result["success"]:
                results["emails_sent"] += 1
                for v in due_visits:
                    supabase.table("vet_visits").update(
                        {"last_reminder_sent_at": "now()"}
                    ).eq("id", v["id"]).execute()
            else:
                results["emails_failed"] += 1
            results["details"].append(
                {"dog": dog["name"], "type": "vet_visit", "sent": send_result["success"]}
            )

    return results