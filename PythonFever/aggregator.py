from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from statistics import median
from typing import Dict, Iterable, List, Optional, Tuple

from model import Reading

@dataclass
class DaySummary:
    station_id: str
    date: datetime
    total_rain_mm: float
    avg_temp_c: float
    count: int
    min_temp_c: float
    max_temp_c: float
    max_rainfall_mm: float
    max_rain_rate_mm_per_hr: float
    first_observation: datetime
    last_observation: datetime

def day_key(ts: datetime) -> Tuple[int, int, int]:
    return ts.year, ts.month, ts.day

def aggregate_day(readings: Iterable[Reading]) -> Dict[Tuple[str, Tuple[int, int, int]], DaySummary]:
    rain_sum = defaultdict(float)
    temp_sum = defaultdict(float)
    count = defaultdict(int)
    min_temp = defaultdict(lambda: float("inf"))
    max_temp = defaultdict(lambda: float("-inf"))
    max_rain_per_reading = defaultdict(float)
    max_rate = defaultdict(float)
    first_ts: Dict[Tuple[str, Tuple[int, int, int]], Optional[datetime]] = defaultdict(lambda: None)
    last_ts: Dict[Tuple[str, Tuple[int, int, int]], Optional[datetime]] = defaultdict(lambda: None)

    prev_ts: Dict[Tuple[str, Tuple[int, int, int]], Optional[datetime]] = defaultdict(lambda: None)

    for r in readings:
        k = (r.station_id, day_key(r.ts))
        rain_sum[k] += r.rainfall_mm
        temp_sum[k] += r.temperature_c
        count[k] += 1
        min_temp[k] = min(min_temp[k], r.temperature_c)
        max_temp[k] = max(max_temp[k], r.temperature_c)
        max_rain_per_reading[k] = max(max_rain_per_reading[k], r.rainfall_mm)

        if first_ts[k] is None or r.ts < first_ts[k]:
            first_ts[k] = r.ts
        if last_ts[k] is None or r.ts > last_ts[k]:
            last_ts[k] = r.ts

        prev = prev_ts[k]
        if prev is not None:
            delta_hours = (r.ts - prev).total_seconds() / 3600.0
            if delta_hours > 0:
                rate = r.rainfall_mm / delta_hours
                max_rate[k] = max(max_rate[k], rate)
        prev_ts[k] = r.ts

    out: Dict[Tuple[str, Tuple[int, int, int]], DaySummary] = {}
    for k in rain_sum:
        sid, date_key = k
        c = count[k]
        avg_temp = (temp_sum[k] / c) if c else 0.0
        # default first/last timestamps to midnight if readings missing
        period_start = first_ts[k] or datetime(*date_key, 0, 0, 0)
        period_end = last_ts[k] or period_start
        out[k] = DaySummary(
            station_id=sid,
            date=datetime(*date_key, 0, 0, 0),
            total_rain_mm=rain_sum[k],
            avg_temp_c=avg_temp,
            count=c,
            min_temp_c=min_temp[k] if min_temp[k] != float("inf") else avg_temp,
            max_temp_c=max_temp[k] if max_temp[k] != float("-inf") else avg_temp,
            max_rainfall_mm=max_rain_per_reading[k],
            max_rain_rate_mm_per_hr=max_rate[k],
            first_observation=period_start,
            last_observation=period_end,
        )
    return out


@dataclass
class WeekSummary:
    station_id: str
    iso_year: int
    iso_week: int
    total_rain_mm: float
    avg_temp_c: float
    days: int
    max_daily_rain_mm: float


@dataclass
class MonthSummary:
    station_id: str
    year: int
    month: int
    total_rain_mm: float
    avg_temp_c: float
    median_temp_c: float
    days: int
    max_daily_rain_mm: float
    wettest_day: datetime


def iso_week_key(ts: datetime) -> Tuple[int, int]:
    iso_year, iso_week, _ = ts.isocalendar()
    return iso_year, iso_week


def aggregate_week(readings: Iterable[Reading]) -> Dict[Tuple[str, Tuple[int, int]], WeekSummary]:
    """Aggregate readings into ISO week buckets."""
    daily = aggregate_day(readings)
    rain_sum = defaultdict(float)
    temp_sum = defaultdict(float)
    count = defaultdict(int)
    day_counter = defaultdict(int)
    max_daily_rain = defaultdict(float)

    for (station_id, _), summary in daily.items():
        key = (station_id, iso_week_key(summary.date))
        rain_sum[key] += summary.total_rain_mm
        temp_sum[key] += summary.avg_temp_c * summary.count
        count[key] += summary.count
        day_counter[key] += 1
        max_daily_rain[key] = max(max_daily_rain[key], summary.total_rain_mm)

    out: Dict[Tuple[str, Tuple[int, int]], WeekSummary] = {}
    for (station_id, (iso_year, iso_week)), total_rain in rain_sum.items():
        key = (station_id, (iso_year, iso_week))
        c = count[key]
        avg_temp = (temp_sum[key] / c) if c else 0.0
        out[key] = WeekSummary(
            station_id=station_id,
            iso_year=iso_year,
            iso_week=iso_week,
            total_rain_mm=total_rain,
            avg_temp_c=avg_temp,
            days=day_counter[key],
            max_daily_rain_mm=max_daily_rain[key],
        )
    return out


def aggregate_month(readings: Iterable[Reading]) -> Dict[Tuple[str, Tuple[int, int]], MonthSummary]:
    """Aggregate readings into monthly buckets."""
    daily = aggregate_day(readings)
    rain_sum = defaultdict(float)
    temp_sum = defaultdict(float)
    temp_samples = defaultdict(list)
    count = defaultdict(int)
    day_counter = defaultdict(int)
    max_daily_rain = defaultdict(float)
    wettest_day = {}

    for (station_id, _), summary in daily.items():
        key = (station_id, (summary.date.year, summary.date.month))
        rain_sum[key] += summary.total_rain_mm
        temp_sum[key] += summary.avg_temp_c * summary.count
        temp_samples[key].append(summary.avg_temp_c)
        count[key] += summary.count
        day_counter[key] += 1
        if summary.total_rain_mm > max_daily_rain[key]:
            max_daily_rain[key] = summary.total_rain_mm
            wettest_day[key] = summary.date

    out: Dict[Tuple[str, Tuple[int, int]], MonthSummary] = {}
    for (station_id, (year, month)), total_rain in rain_sum.items():
        key = (station_id, (year, month))
        c = count[key]
        avg_temp = (temp_sum[key] / c) if c else 0.0
        med_temp = median(temp_samples[key]) if temp_samples[key] else avg_temp
        out[key] = MonthSummary(
            station_id=station_id,
            year=year,
            month=month,
            total_rain_mm=total_rain,
            avg_temp_c=avg_temp,
            median_temp_c=med_temp,
            days=day_counter[key],
            max_daily_rain_mm=max_daily_rain[key],
            wettest_day=wettest_day.get(key, datetime(year, month, 1)),
        )
    return out


@dataclass
class RainEvent:
    station_id: str
    start: datetime
    end: datetime
    total_rain_mm: float
    peak_intensity_mm_per_hr: float
    readings: int


def detect_heavy_rain_events(
    readings: Iterable[Reading],
    per_reading_threshold_mm: float = 1.0,
    max_gap: timedelta = timedelta(minutes=10),
) -> List[RainEvent]:
    """Group consecutive high-rainfall readings into events."""
    sorted_readings = sorted(readings, key=lambda r: (r.station_id, r.ts))

    events: List[RainEvent] = []
    current_event: Optional[RainEvent] = None

    for reading in sorted_readings:
        if reading.rainfall_mm < per_reading_threshold_mm:
            if current_event is not None:
                events.append(current_event)
                current_event = None
            continue

        if current_event is None or reading.station_id != current_event.station_id:
            current_event = RainEvent(
                station_id=reading.station_id,
                start=reading.ts,
                end=reading.ts,
                total_rain_mm=reading.rainfall_mm,
                peak_intensity_mm_per_hr=reading.rainfall_mm,
                readings=1,
            )
            continue

        gap = reading.ts - current_event.end
        if gap > max_gap:
            events.append(current_event)
            current_event = RainEvent(
                station_id=reading.station_id,
                start=reading.ts,
                end=reading.ts,
                total_rain_mm=reading.rainfall_mm,
                peak_intensity_mm_per_hr=reading.rainfall_mm,
                readings=1,
            )
            continue

        delta_hours = max(gap.total_seconds() / 3600.0, 1e-6)
        intensity = reading.rainfall_mm / delta_hours

        current_event.end = reading.ts
        current_event.total_rain_mm += reading.rainfall_mm
        current_event.readings += 1
        current_event.peak_intensity_mm_per_hr = max(
            current_event.peak_intensity_mm_per_hr, intensity, reading.rainfall_mm
        )

    if current_event is not None:
        events.append(current_event)

    return events
