from dataclasses import dataclass
from datetime import datetime

@dataclass(frozen=True)
class Reading:
    station_id: str
    ts: datetime
    temperature_c: float
    rainfall_mm: float
