# routers/dashboard.py
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, get_supabase
from datetime import date, datetime, timedelta

router = APIRouter()


@router.get("/dashboard/{dog_id}")
async def get_dashboard(
    dog_id: str,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    # Ownership check
    dog_res = supabase.table("dogs").select("*").eq("id", dog_id).eq("user_id", user.id).execute()
    if not dog_res.data:
        raise HTTPException(status_code=404, detail="Dog not found")
    dog = dog_res.data[0]

    # Most recent symptom log → health status
    symptom_res = (
        supabase.table("symptom_logs")
        .select("severity, logged_at")
        .eq("dog_id", dog_id)
        .order("logged_at", desc=True)
        .limit(1)
        .execute()
    )
    latest_severity = symptom_res.data[0]["severity"] if symptom_res.data else None

    # Next vet visit
    vet_res = (
        supabase.table("vet_visits")
        .select("next_due_date, vet_name")
        .eq("dog_id", dog_id)
        .not_.is_("next_due_date", "null")
        .order("next_due_date")
        .limit(1)
        .execute()
    )
    next_vet_visit = vet_res.data[0] if vet_res.data else None
    days_until_vet = None
    if next_vet_visit and next_vet_visit.get("next_due_date"):
        due = datetime.strptime(next_vet_visit["next_due_date"], "%Y-%m-%d").date()
        days_until_vet = (due - date.today()).days

    # Today's feeding logs
    today_str = date.today().isoformat()
    feeding_res = (
        supabase.table("feeding_logs")
        .select("*")
        .eq("dog_id", dog_id)
        .gte("logged_at", today_str)
        .execute()
    )
    today_feeding = feeding_res.data or []
    total_grams_today = sum(f.get("quantity_grams") or 0 for f in today_feeding)

    # Last two weight entries → trend
    weight_res = (
        supabase.table("weight_logs")
        .select("weight_kg, logged_at")
        .eq("dog_id", dog_id)
        .order("logged_at", desc=True)
        .limit(2)
        .execute()
    )
    weights = weight_res.data or []
    latest_weight = weights[0]["weight_kg"] if weights else None
    weight_trend = None
    if len(weights) == 2:
        weight_trend = round(weights[0]["weight_kg"] - weights[1]["weight_kg"], 2)

    # Vaccine status summary
    vaccine_res = supabase.table("vaccines").select("status").eq("dog_id", dog_id).execute()
    vaccines = vaccine_res.data or []
    vaccine_summary = {
        "up_to_date": sum(1 for v in vaccines if v["status"] == "up_to_date"),
        "due_soon": sum(1 for v in vaccines if v["status"] == "due_soon"),
        "overdue": sum(1 for v in vaccines if v["status"] == "overdue"),
    }

    return {
        "dog": dog,
        "health_status": latest_severity,  # None | mild | moderate | severe | emergency
        "next_vet_visit": next_vet_visit,
        "days_until_vet": days_until_vet,
        "today_feeding_grams": total_grams_today,
        "today_feeding_entries": len(today_feeding),
        "latest_weight_kg": latest_weight,
        "weight_trend_kg": weight_trend,
        "vaccine_summary": vaccine_summary,
    }