import math
import random
from datetime import datetime, timedelta
from typing import Iterable, Iterator, Optional, Sequence

from model import Reading


def _resolve_start(start: Optional[datetime]) -> datetime:
    return start or datetime.utcnow()


def rainfall_burst(
    station_id: str = "S1",
    start: Optional[datetime] = None,
    increments: int = 100,
    step: float = 0.1,
) -> Iterator[Reading]:
    """Generate a contiguous burst with constant rainfall intensity."""
    t = _resolve_start(start)
    for _ in range(increments):
        yield Reading(station_id=station_id, ts=t, temperature_c=20.0, rainfall_mm=step)
        t += timedelta(minutes=1)


def rainfall_profile(
    station_id: str = "S1",
    start: Optional[datetime] = None,
    profile: Optional[Sequence[float]] = None,
    interval_minutes: int = 5,
    base_temp_c: float = 18.0,
    temp_variation_c: float = 4.0,
) -> Iterator[Reading]:
    """
    Emit readings that follow a custom rainfall profile.

    When no profile is provided a default ramp-up/ramp-down pattern is used.
    """
    profile = profile or [0.0, 0.0, 0.2, 0.8, 1.5, 2.5, 1.0, 0.4, 0.1, 0.0]
    t = _resolve_start(start)
    steps = len(profile)

    for idx, amount in enumerate(profile):
        phase = (idx / max(steps - 1, 1)) * math.pi
        temperature = base_temp_c + temp_variation_c * math.sin(phase - math.pi / 2)
        yield Reading(station_id=station_id, ts=t, temperature_c=temperature, rainfall_mm=amount)
        t += timedelta(minutes=interval_minutes)


def multi_station_cycle(
    stations: Sequence[str] = ("S1", "S2"),
    start: Optional[datetime] = None,
    minutes: int = 24 * 60,
    base_temp_c: float = 18.0,
    diurnal_amplitude_c: float = 6.0,
    rainfall_peak_mm: float = 0.6,
) -> Iterator[Reading]:
    """
    Simulate a full-day cycle for multiple stations.

    Temperatures follow a simple sinusoidal day/night swing while rainfall
    peaks in the afternoon with slight station offsets.
    """
    t = _resolve_start(start)
    for minute in range(minutes):
        # Map minute-of-day to a position on the sine wave.
        phase = 2 * math.pi * (minute / 1440.0)
        base_temp = base_temp_c + diurnal_amplitude_c * math.sin(phase - math.pi / 2)
        for offset, station in enumerate(stations):
            rainfall_phase = phase + offset * (math.pi / len(stations))
            rainfall = max(0.0, rainfall_peak_mm * math.sin(rainfall_phase) ** 2)
            yield Reading(
                station_id=station,
                ts=t,
                temperature_c=base_temp + offset * 0.8,
                rainfall_mm=rainfall,
            )
        t += timedelta(minutes=1)


def with_noise(
    readings: Iterable[Reading],
    *,
    temperature_sigma: float = 0.4,
    rainfall_sigma: float = 0.05,
    seed: Optional[int] = None,
) -> Iterator[Reading]:
    """Perturb an existing reading stream with Gaussian sensor noise."""
    rng = random.Random(seed)
    for reading in readings:
        noisy_temp = reading.temperature_c + rng.gauss(0.0, temperature_sigma)
        noisy_rain = max(0.0, reading.rainfall_mm + rng.gauss(0.0, rainfall_sigma))
        yield Reading(
            station_id=reading.station_id,
            ts=reading.ts,
            temperature_c=noisy_temp,
            rainfall_mm=noisy_rain,
        )
