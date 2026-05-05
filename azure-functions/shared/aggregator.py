"""
LumeEdge Telemetry Aggregator
Cost-optimized in-memory aggregation for IoT telemetry

Design Principles:
- ESP32 sends frequently, but we DON'T store raw telemetry
- Aggregate in memory (1 min / 5 min windows)
- Store ONLY: avg/min/max telemetry, device health, anomaly events, attack incidents
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict
from threading import Lock

logger = logging.getLogger(__name__)


@dataclass
class AggregationWindow:
    """Represents a single aggregation time window for a device."""
    device_id: str
    window_start: datetime
    window_end: datetime
    window_minutes: int = 1
    
    # Temperature aggregates
    temp_values: List[float] = field(default_factory=list)
    
    # Humidity aggregates
    humidity_values: List[float] = field(default_factory=list)
    
    # Event counts
    motion_events: int = 0
    door_events: int = 0
    message_count: int = 0
    anomaly_count: int = 0
    
    # Signal quality
    signal_values: List[int] = field(default_factory=list)
    
    # Battery
    battery_values: List[float] = field(default_factory=list)
    
    def add_telemetry(self, telemetry: Dict[str, Any], is_anomaly: bool = False):
        """Add a telemetry reading to this window."""
        self.message_count += 1
        
        if is_anomaly:
            self.anomaly_count += 1
        
        # Temperature
        if telemetry.get('temperature') is not None:
            self.temp_values.append(float(telemetry['temperature']))
        
        # Humidity
        if telemetry.get('humidity') is not None:
            self.humidity_values.append(float(telemetry['humidity']))
        
        # Motion events
        if telemetry.get('motion_detected'):
            self.motion_events += 1
        
        # Door events
        if telemetry.get('door_open'):
            self.door_events += 1
        
        # Signal strength
        if telemetry.get('signal_strength') is not None:
            self.signal_values.append(int(telemetry['signal_strength']))
        
        # Battery
        if telemetry.get('battery_level') is not None:
            self.battery_values.append(float(telemetry['battery_level']))
    
    def to_aggregate_record(self) -> Dict[str, Any]:
        """Convert window to database record format."""
        return {
            'device_id': self.device_id,
            'window_start': self.window_start,
            'window_end': self.window_end,
            'window_minutes': self.window_minutes,
            
            # Temperature
            'temp_avg': self._avg(self.temp_values),
            'temp_min': self._min(self.temp_values),
            'temp_max': self._max(self.temp_values),
            
            # Humidity
            'humidity_avg': self._avg(self.humidity_values),
            'humidity_min': self._min(self.humidity_values),
            'humidity_max': self._max(self.humidity_values),
            
            # Events
            'motion_events': self.motion_events,
            'door_events': self.door_events,
            'message_count': self.message_count,
            'anomaly_count': self.anomaly_count,
            
            # Signal
            'signal_avg': self._avg_int(self.signal_values),
            'signal_min': self._min_int(self.signal_values),
            
            # Battery
            'battery_avg': self._avg(self.battery_values),
            'battery_min': self._min(self.battery_values),
        }
    
    @staticmethod
    def _avg(values: List[float]) -> Optional[float]:
        return round(sum(values) / len(values), 2) if values else None
    
    @staticmethod
    def _min(values: List[float]) -> Optional[float]:
        return round(min(values), 2) if values else None
    
    @staticmethod
    def _max(values: List[float]) -> Optional[float]:
        return round(max(values), 2) if values else None
    
    @staticmethod
    def _avg_int(values: List[int]) -> Optional[int]:
        return int(sum(values) / len(values)) if values else None
    
    @staticmethod
    def _min_int(values: List[int]) -> Optional[int]:
        return min(values) if values else None


class TelemetryAggregator:
    """
    In-memory telemetry aggregator with automatic window management.
    
    Features:
    - Configurable window sizes (1 min, 5 min)
    - Thread-safe operations
    - Automatic window rotation
    - Callback for persisting completed windows
    """
    
    def __init__(self, window_minutes: int = 1, on_window_complete=None):
        self.window_minutes = window_minutes
        self.on_window_complete = on_window_complete
        
        # Active windows: {device_id: AggregationWindow}
        self._windows: Dict[str, AggregationWindow] = {}
        self._lock = Lock()
    
    def add_telemetry(self, device_id: str, telemetry: Dict[str, Any], 
                      is_anomaly: bool = False) -> Optional[Dict[str, Any]]:
        """
        Add telemetry to the appropriate aggregation window.
        
        Returns completed window record if a window was closed, None otherwise.
        """
        now = datetime.utcnow()
        completed_window = None
        
        with self._lock:
            # Get or create window for device
            window = self._windows.get(device_id)
            
            # Check if we need to rotate the window
            if window and now >= window.window_end:
                # Window complete - prepare for storage
                completed_window = window.to_aggregate_record()
                window = None
            
            # Create new window if needed
            if window is None:
                window_start = self._get_window_start(now)
                window_end = window_start + timedelta(minutes=self.window_minutes)
                window = AggregationWindow(
                    device_id=device_id,
                    window_start=window_start,
                    window_end=window_end,
                    window_minutes=self.window_minutes
                )
                self._windows[device_id] = window
            
            # Add telemetry to window
            window.add_telemetry(telemetry, is_anomaly)
        
        # Trigger callback if window completed
        if completed_window and self.on_window_complete:
            try:
                self.on_window_complete(completed_window)
            except Exception as e:
                logger.error(f"Error in window complete callback: {e}")
        
        return completed_window
    
    def flush_all(self) -> List[Dict[str, Any]]:
        """
        Flush all active windows (for shutdown or forced persistence).
        Returns list of aggregate records.
        """
        completed = []
        
        with self._lock:
            for device_id, window in self._windows.items():
                if window.message_count > 0:
                    completed.append(window.to_aggregate_record())
            self._windows.clear()
        
        return completed
    
    def get_stats(self) -> Dict[str, Any]:
        """Get aggregator statistics."""
        with self._lock:
            return {
                'active_windows': len(self._windows),
                'window_minutes': self.window_minutes,
                'devices': list(self._windows.keys())
            }
    
    def _get_window_start(self, now: datetime) -> datetime:
        """Calculate the start of the current window."""
        # Align to window boundaries
        minute = (now.minute // self.window_minutes) * self.window_minutes
        return now.replace(minute=minute, second=0, microsecond=0)


# Global aggregator instances
_aggregator_1min: Optional[TelemetryAggregator] = None
_aggregator_5min: Optional[TelemetryAggregator] = None


def get_aggregator(window_minutes: int = 1) -> TelemetryAggregator:
    """Get or create the global aggregator instance."""
    global _aggregator_1min, _aggregator_5min
    
    if window_minutes == 1:
        if _aggregator_1min is None:
            _aggregator_1min = TelemetryAggregator(window_minutes=1)
        return _aggregator_1min
    elif window_minutes == 5:
        if _aggregator_5min is None:
            _aggregator_5min = TelemetryAggregator(window_minutes=5)
        return _aggregator_5min
    else:
        return TelemetryAggregator(window_minutes=window_minutes)
