import argparse
from datetime import timedelta
from pathlib import Path
from typing import Iterable, List, Optional, Sequence

from aggregator import (
    DaySummary,
    MonthSummary,
    RainEvent,
    WeekSummary,
    aggregate_day,
    aggregate_month,
    aggregate_week,
    detect_heavy_rain_events,
)
from analytics import DrySpell, detect_dry_spells, rainfall_percentiles, top_wettest_days
from model import Reading
from persistence import (
    write_day_summary_csv,
    write_dry_spells_csv,
    write_month_summary_csv,
    write_percentiles_json,
    write_rain_events_csv,
    write_week_summary_json,
)
from reporter import (
    rain_alert,
    render,
    render_detailed,
    render_dry_spells,
    render_events,
    render_month,
    render_percentiles,
    temperature_alert,
)
from sensor_stream import multi_station_cycle, rainfall_burst, rainfall_profile, with_noise


def _parse_profile(profile_arg: Optional[str]) -> Optional[Sequence[float]]:
    if not profile_arg:
        return None
    return [float(chunk.strip()) for chunk in profile_arg.split(",") if chunk.strip()]


def _parse_percentiles(percentiles_arg: Optional[str]) -> Sequence[float]:
    if not percentiles_arg:
        return (25.0, 50.0, 75.0, 90.0, 95.0, 99.0)
    return [float(chunk.strip()) for chunk in percentiles_arg.split(",") if chunk.strip()]


def build_readings(args: argparse.Namespace) -> List[Reading]:
    if args.scenario == "burst":
        base: Iterable[Reading] = rainfall_burst(
            station_id=args.station,
            start=None,
            increments=args.increments,
            step=args.step,
        )
    elif args.scenario == "profile":
        base = rainfall_profile(
            station_id=args.station,
            start=None,
            profile=_parse_profile(args.profile),
            interval_minutes=args.interval,
            base_temp_c=args.base_temp,
            temp_variation_c=args.temp_variation,
        )
    elif args.scenario == "cycle":
        base = multi_station_cycle(
            stations=args.stations,
            start=None,
            minutes=args.minutes,
            base_temp_c=args.base_temp,
            diurnal_amplitude_c=args.diurnal_amp,
            rainfall_peak_mm=args.rainfall_peak,
        )
    else:
        raise ValueError(f"Unknown scenario '{args.scenario}'")

    if args.add_noise:
        base = with_noise(
            base,
            temperature_sigma=args.noise_temp,
            rainfall_sigma=args.noise_rain,
            seed=args.noise_seed,
        )

    return list(base)


def render_summaries(args: argparse.Namespace, summaries: List[DaySummary]) -> None:
    limit = args.limit or len(summaries)
    for summary in summaries[:limit]:
        print(render_detailed(summary) if args.detailed else render(summary))
        alerts = []
        if rain_alert(summary, threshold_mm=args.threshold):
            alerts.append("rain")
        if temperature_alert(
            summary,
            low_threshold_c=args.temp_low,
            high_threshold_c=args.temp_high,
            inclusive=args.temp_inclusive,
        ):
            alerts.append("temperature")
        if alerts:
            print(f"  Alerts: {', '.join(alerts)}")


def run_demo(args: argparse.Namespace) -> None:
    readings = build_readings(args)
    day_map = aggregate_day(readings)
    day_summaries = sorted(day_map.values(), key=lambda s: (s.station_id, s.date))

    if not day_summaries:
        print("No readings generated.")
        return

    render_summaries(args, day_summaries)

    if args.show_weekly or args.week_json:
        weekly_map = aggregate_week(readings)
        weekly: List[WeekSummary] = sorted(
            weekly_map.values(), key=lambda w: (w.station_id, w.iso_year, w.iso_week)
        )
        if args.show_weekly:
            print("\nWeekly rollups:")
            for summary in weekly:
                print(
                    f"[{summary.station_id}] ISO {summary.iso_year}-W{summary.iso_week:02d} | "
                    f"rain={summary.total_rain_mm:.2f} mm | avgT={summary.avg_temp_c:.1f} °C | "
                    f"days={summary.days} | maxDaily={summary.max_daily_rain_mm:.2f} mm"
        )
        if args.week_json:
            write_week_summary_json(args.week_json, weekly)

    if args.show_monthly or args.month_csv:
        monthly_map = aggregate_month(readings)
        monthly: List[MonthSummary] = sorted(
            monthly_map.values(), key=lambda m: (m.station_id, m.year, m.month)
        )
        if args.show_monthly:
            print("\nMonthly rollups:")
            for summary in monthly:
                print(render_month(summary))
        if args.month_csv:
            write_month_summary_csv(args.month_csv, monthly)

    if args.top_wet:
        top = top_wettest_days(day_summaries, limit=args.top_wet)
        if top:
            print(f"\nTop {len(top)} wettest days:")
            for summary in top:
                print(render(summary))

    show_percentiles = args.percentiles or args.percentiles_json
    if show_percentiles:
        percentiles = rainfall_percentiles(
            day_summaries, percentiles=_parse_percentiles(args.percentiles_values)
        )
        if args.percentiles:
            print("\nDaily rainfall percentiles:")
            print(render_percentiles(percentiles))
        if args.percentiles_json:
            write_percentiles_json(args.percentiles_json, percentiles)

    events: List[RainEvent] = []
    if args.events or args.events_csv:
        events = detect_heavy_rain_events(
            readings,
            per_reading_threshold_mm=args.events_threshold,
            max_gap=timedelta(minutes=args.events_gap),
        )
        if args.events and events:
            print("\nHeavy rain events:")
            print(render_events(events))
        elif args.events:
            print("\nHeavy rain events: none detected")
        if args.events_csv:
            write_rain_events_csv(args.events_csv, events)

    dry_spells: List[DrySpell] = []
    if args.dry_spells or args.dry_csv:
        dry_spells = detect_dry_spells(
            readings,
            dry_threshold_mm=args.dry_threshold,
            min_duration=timedelta(hours=args.dry_min_hours),
            max_gap=timedelta(minutes=args.dry_gap),
        )
        if args.dry_spells:
            if dry_spells:
                print("\nDetected dry spells:")
                print(render_dry_spells(dry_spells))
            else:
                print("\nDetected dry spells: none")
        if args.dry_csv:
            write_dry_spells_csv(args.dry_csv, dry_spells)

    if args.csv:
        write_day_summary_csv(args.csv, day_summaries)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Synthetic rainfall analytics demo")
    parser.add_argument("--scenario", choices=["burst", "profile", "cycle"], default="burst")
    parser.add_argument("--station", default="S1", help="Station id for single-station scenarios")
    parser.add_argument(
        "--stations",
        nargs="+",
        default=["S1", "S2"],
        help="Station ids for multi-station scenarios",
    )
    parser.add_argument("--increments", type=int, default=100, help="Number of readings for burst scenario")
    parser.add_argument("--step", type=float, default=0.1, help="Rainfall step per reading for burst scenario")

    parser.add_argument("--profile", help="Comma separated rainfall profile for profile scenario")
    parser.add_argument("--interval", type=int, default=5, help="Minutes between profile readings")

    parser.add_argument("--minutes", type=int, default=24 * 60, help="Simulation length for cycle scenario")
    parser.add_argument("--base-temp", type=float, default=18.0, help="Base temperature for simulations")
    parser.add_argument("--temp-variation", type=float, default=4.0, help="Temperature swing for profile scenario")
    parser.add_argument("--diurnal-amp", type=float, default=6.0, help="Temperature swing for cycle scenario")
    parser.add_argument("--rainfall-peak", type=float, default=0.6, help="Peak rainfall for cycle scenario")

    parser.add_argument("--add-noise", action="store_true", help="Apply Gaussian noise to the generated stream")
    parser.add_argument("--noise-temp", type=float, default=0.4, help="Temperature noise sigma")
    parser.add_argument("--noise-rain", type=float, default=0.05, help="Rainfall noise sigma")
    parser.add_argument("--noise-seed", type=int, help="Optional RNG seed for noise")

    parser.add_argument("--threshold", type=float, default=10.0, help="Rain alert threshold")
    parser.add_argument("--temp-low", type=float, help="Low temperature alert threshold")
    parser.add_argument("--temp-high", type=float, help="High temperature alert threshold")
    parser.add_argument(
        "--temp-inclusive",
        action="store_true",
        help="Use inclusive comparisons when checking temperature thresholds",
    )

    parser.add_argument("--detailed", action="store_true", help="Render detailed day summaries")
    parser.add_argument("--limit", type=int, help="Only render the first N day summaries")
    parser.add_argument("--show-weekly", action="store_true", help="Display weekly rollups in stdout")
    parser.add_argument("--show-monthly", action="store_true", help="Display monthly rollups in stdout")
    parser.add_argument("--events", action="store_true", help="Display heavy rain events in stdout")
    parser.add_argument("--events-threshold", type=float, default=1.0, help="Rain threshold per reading for events")
    parser.add_argument("--events-gap", type=int, default=10, help="Minutes allowed between event readings")
    parser.add_argument("--top-wet", type=int, default=0, help="Display the N wettest days")
    parser.add_argument("--percentiles", action="store_true", help="Display rainfall percentiles")
    parser.add_argument(
        "--percentiles-values",
        help="Comma separated percentile list (e.g. 50,90,99) used when displaying/writing percentiles",
    )
    parser.add_argument("--dry-spells", action="store_true", help="Display detected dry spells")
    parser.add_argument("--dry-threshold", type=float, default=0.05, help="Rainfall threshold (mm) to qualify as dry")
    parser.add_argument(
        "--dry-min-hours",
        type=float,
        default=6.0,
        help="Minimum duration in hours for a dry spell to be reported",
    )
    parser.add_argument(
        "--dry-gap",
        type=int,
        default=45,
        help="Maximum allowed gap in minutes between dry readings before closing a spell",
    )

    parser.add_argument("--csv", type=Path, help="Path to write daily summaries as CSV")
    parser.add_argument("--week-json", type=Path, help="Path to write weekly summaries as JSON")
    parser.add_argument("--events-csv", type=Path, help="Path to write detected events as CSV")
    parser.add_argument("--month-csv", type=Path, help="Path to write monthly rollups as CSV")
    parser.add_argument("--dry-csv", type=Path, help="Path to write dry spells as CSV")
    parser.add_argument("--percentiles-json", type=Path, help="Path to write rainfall percentiles as JSON")

    return parser.parse_args()


def main() -> None:
    args = parse_args()
    run_demo(args)


if __name__ == "__main__":
    main()
