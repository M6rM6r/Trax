"""Work pattern analysis router — analyzes historical attendance patterns."""

from fastapi import APIRouter
from schemas.schemas import PatternAnalysisInput, PatternAnalysisOutput
from datetime import datetime

router = APIRouter()


@router.post("/analyze", response_model=PatternAnalysisOutput)
async def analyze_patterns(input_data: PatternAnalysisInput):
    history = input_data.attendance_history

    if not history:
        return PatternAnalysisOutput(
            employee_id=input_data.employee_id,
            avg_check_in_time="N/A",
            avg_check_out_time="N/A",
            avg_worked_hours=0.0,
            on_time_rate=0.0,
            pattern_consistency=0.0,
            insights=["No attendance history available."],
        )

    check_in_hours = []
    check_out_hours = []
    worked_hours_list = []
    on_time_count = 0

    for record in history:
        if record.get("checkInTime"):
            try:
                t = datetime.strptime(record["checkInTime"], "%H:%M")
                check_in_hours.append(t.hour + t.minute / 60)
            except (ValueError, TypeError):
                pass
        if record.get("checkOutTime"):
            try:
                t = datetime.strptime(record["checkOutTime"], "%H:%M")
                check_out_hours.append(t.hour + t.minute / 60)
            except (ValueError, TypeError):
                pass
        if record.get("workedHours"):
            worked_hours_list.append(float(record["workedHours"]))
        if record.get("status") == "present":
            on_time_count += 1

    avg_check_in = sum(check_in_hours) / len(check_in_hours) if check_in_hours else 0
    avg_check_out = sum(check_out_hours) / len(check_out_hours) if check_out_hours else 0
    avg_worked = sum(worked_hours_list) / len(worked_hours_list) if worked_hours_list else 0
    on_time_rate = on_time_count / len(history) if history else 0

    # Consistency: lower variance = higher consistency
    if len(check_in_hours) > 1:
        import statistics
        std_dev = statistics.stdev(check_in_hours)
        consistency = max(0, 1 - std_dev / 2)
    else:
        consistency = 0.5

    insights = []
    if avg_check_in > 9:
        insights.append("Employee consistently arrives after 9 AM — consider adjusting shift start.")
    if avg_worked < 7:
        insights.append("Average worked hours below 7 — review workload or schedule.")
    if on_time_rate < 0.7:
        insights.append("On-time rate below 70% — intervention recommended.")
    if consistency > 0.8:
        insights.append("Highly consistent attendance pattern — reliable employee.")
    if not insights:
        insights.append("Attendance patterns within normal range.")

    def format_time(hours: float) -> str:
        h = int(hours)
        m = int((hours - h) * 60)
        return f"{h:02d}:{m:02d}"

    return PatternAnalysisOutput(
        employee_id=input_data.employee_id,
        avg_check_in_time=format_time(avg_check_in) if check_in_hours else "N/A",
        avg_check_out_time=format_time(avg_check_out) if check_out_hours else "N/A",
        avg_worked_hours=round(avg_worked, 2),
        on_time_rate=round(on_time_rate, 4),
        pattern_consistency=round(consistency, 4),
        insights=insights,
    )
