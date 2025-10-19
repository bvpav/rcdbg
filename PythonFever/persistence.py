import csv
import json
from pathlib import Path
from typing import Iterable, Mapping, Union

from aggregator import DaySummary, MonthSummary, RainEvent, WeekSummary
from analytics import DrySpell


def _prepare_path(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def write_day_summary_csv(path: Union[str, Path], summaries: Iterable[DaySummary]) -> Path:
    """Persist day summaries to a CSV file."""
    target = _prepare_path(Path(path))
    fieldnames = [
        "station_id",
        "date",
        "total_rain_mm",
        "avg_temp_c",
        "min_temp_c",
        "max_temp_c",
        "max_rainfall_mm",
        "max_rain_rate_mm_per_hr",
        "count",
        "first_observation",
        "last_observation",
    ]

    with target.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for summary in summaries:
            writer.writerow(
                {
                    "station_id": summary.station_id,
                    "date": summary.date.date().isoformat(),
                    "total_rain_mm": f"{summary.total_rain_mm:.3f}",
                    "avg_temp_c": f"{summary.avg_temp_c:.2f}",
                    "min_temp_c": f"{summary.min_temp_c:.2f}",
                    "max_temp_c": f"{summary.max_temp_c:.2f}",
                    "max_rainfall_mm": f"{summary.max_rainfall_mm:.3f}",
                    "max_rain_rate_mm_per_hr": f"{summary.max_rain_rate_mm_per_hr:.2f}",
                    "count": summary.count,
                    "first_observation": summary.first_observation.isoformat(),
                    "last_observation": summary.last_observation.isoformat(),
                }
            )
    return target


def write_week_summary_json(path: Union[str, Path], summaries: Iterable[WeekSummary]) -> Path:
    """Persist weekly summaries to a JSON file."""
    target = _prepare_path(Path(path))
    payload = [
        {
            "station_id": summary.station_id,
            "iso_year": summary.iso_year,
            "iso_week": summary.iso_week,
            "total_rain_mm": summary.total_rain_mm,
            "avg_temp_c": summary.avg_temp_c,
            "days": summary.days,
            "max_daily_rain_mm": summary.max_daily_rain_mm,
        }
        for summary in summaries
    ]
    target.write_text(json.dumps(payload, indent=2))
    return target


def write_month_summary_csv(path: Union[str, Path], summaries: Iterable[MonthSummary]) -> Path:
    """Persist monthly summaries to CSV."""
    target = _prepare_path(Path(path))
    fieldnames = [
        "station_id",
        "year",
        "month",
        "total_rain_mm",
        "avg_temp_c",
        "median_temp_c",
        "days",
        "max_daily_rain_mm",
        "wettest_day",
    ]
    with target.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for summary in summaries:
            writer.writerow(
                {
                    "station_id": summary.station_id,
                    "year": summary.year,
                    "month": summary.month,
                    "total_rain_mm": f"{summary.total_rain_mm:.3f}",
                    "avg_temp_c": f"{summary.avg_temp_c:.2f}",
                    "median_temp_c": f"{summary.median_temp_c:.2f}",
                    "days": summary.days,
                    "max_daily_rain_mm": f"{summary.max_daily_rain_mm:.3f}",
                    "wettest_day": summary.wettest_day.date().isoformat(),
                }
            )
    return target


def write_rain_events_csv(path: Union[str, Path], events: Iterable[RainEvent]) -> Path:
    """Persist heavy-rain events to CSV for downstream use."""
    target = _prepare_path(Path(path))
    fieldnames = [
        "station_id",
        "start",
        "end",
        "duration_seconds",
        "total_rain_mm",
        "peak_intensity_mm_per_hr",
        "readings",
    ]
    with target.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for event in events:
            duration_seconds = (event.end - event.start).total_seconds()
            writer.writerow(
                {
                    "station_id": event.station_id,
                    "start": event.start.isoformat(),
                    "end": event.end.isoformat(),
                    "duration_seconds": int(duration_seconds),
                    "total_rain_mm": f"{event.total_rain_mm:.3f}",
                    "peak_intensity_mm_per_hr": f"{event.peak_intensity_mm_per_hr:.2f}",
                    "readings": event.readings,
                }
            )
    return target


def write_dry_spells_csv(path: Union[str, Path], spells: Iterable[DrySpell]) -> Path:
    """Persist detected dry spells to CSV."""
    target = _prepare_path(Path(path))
    fieldnames = ["station_id", "start", "end", "duration_hours", "readings"]
    with target.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for spell in spells:
            writer.writerow(
                {
                    "station_id": spell.station_id,
                    "start": spell.start.isoformat(),
                    "end": spell.end.isoformat(),
                    "duration_hours": f"{spell.duration_hours:.2f}",
                    "readings": spell.readings,
                }
            )
    return target


def write_percentiles_json(path: Union[str, Path], percentiles: Mapping[float, float]) -> Path:
    """Persist percentile summary to JSON."""
    target = _prepare_path(Path(path))
    payload = {
        f"P{(f'{p:.1f}'.rstrip('0').rstrip('.') if not float(p).is_integer() else int(p))}": value
        for p, value in percentiles.items()
    }
    target.write_text(json.dumps(payload, indent=2))
    return target
