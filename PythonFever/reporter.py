from typing import Iterable, Mapping, Optional

from aggregator import DaySummary, MonthSummary, RainEvent
from analytics import DrySpell, classify_day_severity


def rain_alert(summary: DaySummary, threshold_mm: float = 10.0, tolerance: float = 1e-6) -> bool:
    """Trigger when rainfall crosses the threshold within numeric tolerance."""
    return summary.total_rain_mm + tolerance >= threshold_mm


def temperature_alert(
    summary: DaySummary,
    *,
    low_threshold_c: Optional[float] = None,
    high_threshold_c: Optional[float] = None,
    inclusive: bool = True,
) -> bool:
    """Flag when temperature leaves the configured envelope."""
    low_hit = (
        False
        if low_threshold_c is None
        else summary.min_temp_c <= low_threshold_c if inclusive else summary.min_temp_c < low_threshold_c
    )
    high_hit = (
        False
        if high_threshold_c is None
        else summary.max_temp_c >= high_threshold_c if inclusive else summary.max_temp_c > high_threshold_c
    )
    return low_hit or high_hit


def render(summary: DaySummary) -> str:
    severity = classify_day_severity(summary)
    return (
        f"[{summary.station_id}] {summary.date.date()} | "
        f"rain={summary.total_rain_mm:.2f} mm ({severity}) | "
        f"avgT={summary.avg_temp_c:.1f} °C "
        f"(min={summary.min_temp_c:.1f}/max={summary.max_temp_c:.1f}) | "
        f"peakRain={summary.max_rainfall_mm:.2f} mm | "
        f"peakIntensity={summary.max_rain_rate_mm_per_hr:.1f} mm/h | "
        f"n={summary.count}"
    )


def render_detailed(summary: DaySummary) -> str:
    duration = summary.last_observation - summary.first_observation
    duration_hours = duration.total_seconds() / 3600 if summary.count > 1 else 0.0
    mean_rate = summary.total_rain_mm / duration_hours if duration_hours > 0 else summary.total_rain_mm
    severity = classify_day_severity(summary)
    return (
        f"Station {summary.station_id} on {summary.date.date()}\n"
        f"  Observations : {summary.count}\n"
        f"  Window       : {summary.first_observation.isoformat()} -> {summary.last_observation.isoformat()}\n"
        f"  Rain total   : {summary.total_rain_mm:.2f} mm ({severity}) "
        f"(mean {mean_rate:.1f} mm/h, peak {summary.max_rain_rate_mm_per_hr:.1f} mm/h)\n"
        f"  Temperature  : avg {summary.avg_temp_c:.1f} °C "
        f"(min {summary.min_temp_c:.1f} °C / max {summary.max_temp_c:.1f} °C)"
    )


def render_events(events: Iterable[RainEvent]) -> str:
    lines = []
    for event in events:
        duration = event.end - event.start
        rate = event.total_rain_mm / max(duration.total_seconds() / 3600.0, 1e-6)
        peak = max(event.peak_intensity_mm_per_hr, rate, event.total_rain_mm)
        lines.append(
            f"[{event.station_id}] {event.start.isoformat()} -> {event.end.isoformat()} "
            f"duration={duration} total={event.total_rain_mm:.2f} mm "
            f"peak={peak:.1f} mm/h readings={event.readings}"
        )
    return "\n".join(lines)


def render_month(summary: MonthSummary) -> str:
    return (
        f"[{summary.station_id}] {summary.year}-{summary.month:02d} | "
        f"rain={summary.total_rain_mm:.2f} mm | "
        f"avgT={summary.avg_temp_c:.1f} °C (median={summary.median_temp_c:.1f}) | "
        f"days={summary.days} | maxDaily={summary.max_daily_rain_mm:.2f} mm "
        f"on {summary.wettest_day.date()}"
    )


def render_percentiles(percentiles: Mapping[float, float]) -> str:
    def _label(p: float) -> str:
        if float(p).is_integer():
            return f"{int(p)}"
        return f"{p:.1f}".rstrip("0").rstrip(".")

    parts = [f"P{_label(p)}={value:.2f} mm" for p, value in sorted(percentiles.items())]
    return " | ".join(parts)


def render_dry_spells(spells: Iterable[DrySpell]) -> str:
    lines = []
    for spell in spells:
        lines.append(
            f"[{spell.station_id}] {spell.start.isoformat()} -> {spell.end.isoformat()} "
            f"duration={spell.duration_hours:.1f} h readings={spell.readings}"
        )
    return "\n".join(lines)
