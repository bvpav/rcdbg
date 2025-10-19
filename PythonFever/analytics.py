import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from aggregator import DaySummary
from model import Reading


@dataclass
class DrySpell:
    station_id: str
    start: datetime
    end: datetime
    duration_hours: float
    readings: int


def detect_dry_spells(
    readings: Iterable[Reading],
    *,
    dry_threshold_mm: float = 0.05,
    min_duration: timedelta = timedelta(hours=6),
    max_gap: timedelta = timedelta(minutes=45),
) -> List[DrySpell]:
    """Identify extended periods with minimal rainfall."""
    sorted_readings = sorted(readings, key=lambda r: (r.station_id, r.ts))

    spells: List[DrySpell] = []
    current: Dict[str, Optional[DrySpell]] = {}
    last_ts: Dict[str, Optional[datetime]] = {}

    min_hours = min_duration.total_seconds() / 3600.0

    def finalize(station_id: str) -> None:
        active = current.get(station_id)
        if active and active.duration_hours >= min_hours:
            spells.append(active)
        current[station_id] = None

    for reading in sorted_readings:
        station_id = reading.station_id
        prev_ts = last_ts.get(station_id)
        active = current.get(station_id)

        if active and prev_ts and reading.ts - prev_ts > max_gap:
            finalize(station_id)
            active = None

        if reading.rainfall_mm <= dry_threshold_mm:
            if active is None:
                active = DrySpell(
                    station_id=station_id,
                    start=reading.ts,
                    end=reading.ts,
                    duration_hours=0.0,
                    readings=1,
                )
                current[station_id] = active
            else:
                active.end = reading.ts
                active.readings += 1

            active.duration_hours = max(
                (active.end - active.start).total_seconds() / 3600.0, 0.0
            )
        else:
            finalize(station_id)

        last_ts[station_id] = reading.ts

    for station_id in list(current.keys()):
        finalize(station_id)

    return spells


def top_wettest_days(
    summaries: Iterable[DaySummary],
    *,
    limit: int = 5,
) -> List[DaySummary]:
    """Return the wettest day summaries across stations."""
    return sorted(
        summaries,
        key=lambda s: (s.total_rain_mm, s.date),
        reverse=True,
    )[:limit]


def rainfall_percentiles(
    summaries: Iterable[DaySummary],
    percentiles: Sequence[float] = (25, 50, 75, 90, 95, 99),
) -> Dict[float, float]:
    """Compute rainfall percentiles from day summaries."""
    totals = sorted(summary.total_rain_mm for summary in summaries)
    if not totals:
        return {p: 0.0 for p in percentiles}
    results: Dict[float, float] = {}
    count = len(totals)
    for p in percentiles:
        clamped = min(max(p, 0.0), 100.0)
        if clamped <= 0:
            results[p] = totals[0]
            continue
        if clamped >= 100:
            results[p] = totals[-1]
            continue
        rank = (clamped / 100.0) * (count - 1)
        lower = int(math.floor(rank))
        upper = int(math.ceil(rank))
        if lower == upper:
            results[p] = totals[lower]
        else:
            fraction = rank - lower
            results[p] = totals[lower] + (totals[upper] - totals[lower]) * fraction
    return results


def classify_rain_intensity(
    total_rain_mm: float,
    thresholds: Sequence[float] = (2.5, 7.5, 15.0, 30.0),
) -> str:
    """
    Classify rainfall severity similar to standard meteorological scales.

    thresholds define the boundaries for light, moderate, heavy, very heavy rain.
    """
    labels = ["no rain", "light", "moderate", "heavy", "very heavy", "violent"]
    if total_rain_mm <= 0.0:
        return labels[0]
    for idx, threshold in enumerate(thresholds, start=1):
        if total_rain_mm < threshold:
            return labels[min(idx, len(labels) - 1)]
    return labels[min(len(labels) - 1, len(thresholds) + 1)]


def classify_day_severity(summary: DaySummary, thresholds: Sequence[float] = (2.5, 7.5, 15.0, 30.0)) -> str:
    return classify_rain_intensity(summary.total_rain_mm, thresholds)
