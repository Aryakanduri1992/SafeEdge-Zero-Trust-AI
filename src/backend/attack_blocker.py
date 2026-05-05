"""
Attack Blocker (Python)
Task 3.1: Attack blocking with success/failure detection
Implements countermeasure strategies for detected security threats
"""

from dataclasses import dataclass
from typing import List
from enum import Enum
import asyncio
import random
import time

from security_event_detector import SecurityEvent, ThreatType


class BlockingStrategy(str, Enum):
    """Blocking strategy types"""
    NETWORK_ISOLATION = "network_isolation"
    SYSTEM_BACKUP = "system_backup"
    TEMPERATURE_OVERRIDE = "temperature_override"
    ACCESS_LOCKDOWN = "access_lockdown"
    ALERT_ESCALATION = "alert_escalation"
    NONE = "none"


@dataclass
class BlockingAttempt:
    """Single blocking attempt result"""
    id: str
    event_id: str
    timestamp: str
    strategy: BlockingStrategy
    success: bool
    duration: float  # milliseconds
    details: str
    fallback_required: bool


@dataclass
class CountermeasureResult:
    """Complete countermeasure result"""
    blocked: bool
    attempts: List[BlockingAttempt]
    final_status: str  # 'safe', 'contained', 'failed'
    requires_human_intervention: bool
    affected_systems: List[str]


class AttackBlocker:
    """Implements attack blocking strategies"""
    
    def __init__(self):
        self.blocking_history: dict[str, List[BlockingAttempt]] = {}
    
    async def block_threat(self, event: SecurityEvent) -> CountermeasureResult:
        """
        Attempt to block detected security threat
        
        Args:
            event: SecurityEvent to block
            
        Returns:
            CountermeasureResult with blocking status
        """
        attempts: List[BlockingAttempt] = []
        blocked = False
        requires_human_intervention = False
        affected_systems: List[str] = []
        
        # Select blocking strategies based on threat type
        strategies = self._select_strategies(event.threat_type)
        
        # Execute blocking strategies
        for strategy in strategies:
            attempt = await self._execute_strategy(event, strategy)
            attempts.append(attempt)
            
            if attempt.success:
                blocked = True
                break  # First successful strategy wins
        
        # Determine final status
        if blocked and event.threat_level.value != 'critical':
            final_status = 'safe'
        elif blocked and event.threat_level.value == 'critical':
            final_status = 'contained'
            requires_human_intervention = True
        else:
            final_status = 'failed'
            requires_human_intervention = True
        
        # Store blocking history
        self.blocking_history[event.id] = attempts
        
        return CountermeasureResult(
            blocked=blocked,
            attempts=attempts,
            final_status=final_status,
            requires_human_intervention=requires_human_intervention,
            affected_systems=affected_systems
        )
    
    def _select_strategies(self, threat_type: ThreatType) -> List[BlockingStrategy]:
        """Select appropriate blocking strategies for threat type"""
        
        strategy_map = {
            ThreatType.TEMPERATURE_ATTACK: [
                BlockingStrategy.TEMPERATURE_OVERRIDE,
                BlockingStrategy.SYSTEM_BACKUP,
                BlockingStrategy.ALERT_ESCALATION
            ],
            ThreatType.ACCESS_ATTACK: [
                BlockingStrategy.ACCESS_LOCKDOWN,
                BlockingStrategy.NETWORK_ISOLATION,
                BlockingStrategy.ALERT_ESCALATION
            ],
            ThreatType.POWER_ATTACK: [
                BlockingStrategy.SYSTEM_BACKUP,
                BlockingStrategy.ALERT_ESCALATION
            ],
            ThreatType.NETWORK_ATTACK: [
                BlockingStrategy.NETWORK_ISOLATION,
                BlockingStrategy.SYSTEM_BACKUP,
                BlockingStrategy.ALERT_ESCALATION
            ],
            ThreatType.VIBRATION_ATTACK: [
                BlockingStrategy.ACCESS_LOCKDOWN,
                BlockingStrategy.ALERT_ESCALATION
            ],
            ThreatType.ENVIRONMENTAL_ATTACK: [
                BlockingStrategy.SYSTEM_BACKUP,
                BlockingStrategy.TEMPERATURE_OVERRIDE,
                BlockingStrategy.ALERT_ESCALATION
            ]
        }
        
        return strategy_map.get(threat_type, [BlockingStrategy.ALERT_ESCALATION])
    
    async def _execute_strategy(
        self, 
        event: SecurityEvent, 
        strategy: BlockingStrategy
    ) -> BlockingAttempt:
        """Execute specific blocking strategy"""
        
        start_time = time.time()
        attempt_id = f"blk_{int(time.time())}_{random.randint(1000, 9999)}"
        
        try:
            success = False
            details = ""
            
            if strategy == BlockingStrategy.NETWORK_ISOLATION:
                success = await self._simulate_network_isolation(event)
                details = (
                    "Device isolated from network. Threat contained to local segment."
                    if success else
                    "Network isolation failed. Threat may spread to other devices."
                )
            
            elif strategy == BlockingStrategy.SYSTEM_BACKUP:
                success = await self._simulate_backup_activation(event)
                details = (
                    "Backup systems activated. Critical functions maintained."
                    if success else
                    "Backup activation failed. Manual intervention required."
                )
            
            elif strategy == BlockingStrategy.TEMPERATURE_OVERRIDE:
                success = await self._simulate_temperature_override(event)
                details = (
                    "Temperature control overridden. Safe range restored."
                    if success else
                    "Temperature override failed. Patient safety at risk."
                )
            
            elif strategy == BlockingStrategy.ACCESS_LOCKDOWN:
                success = await self._simulate_access_lockdown(event)
                details = (
                    "Physical access locked down. Unauthorized entry prevented."
                    if success else
                    "Lockdown failed. Security breach in progress."
                )
            
            elif strategy == BlockingStrategy.ALERT_ESCALATION:
                success = True  # Always succeeds
                details = "Alert escalated to security team. Human intervention initiated."
            
            else:
                success = False
                details = "Unknown blocking strategy."
            
            duration = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            return BlockingAttempt(
                id=attempt_id,
                event_id=event.id,
                timestamp=event.timestamp,
                strategy=strategy,
                success=success,
                duration=duration,
                details=details,
                fallback_required=not success
            )
        
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            return BlockingAttempt(
                id=attempt_id,
                event_id=event.id,
                timestamp=event.timestamp,
                strategy=strategy,
                success=False,
                duration=duration,
                details=f"Blocking failed: {str(e)}",
                fallback_required=True
            )
    
    async def _simulate_network_isolation(self, event: SecurityEvent) -> bool:
        """Simulate network isolation (70% success rate)"""
        await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # Higher success rate for network attacks
        if event.threat_type == ThreatType.NETWORK_ATTACK:
            return random.random() > 0.2  # 80% success
        
        return random.random() > 0.3  # 70% success
    
    async def _simulate_backup_activation(self, event: SecurityEvent) -> bool:
        """Simulate backup system activation (85% success rate)"""
        await asyncio.sleep(random.uniform(0.15, 0.4))
        
        # Higher success rate for power attacks
        if event.threat_type == ThreatType.POWER_ATTACK:
            return random.random() > 0.1  # 90% success
        
        return random.random() > 0.15  # 85% success
    
    async def _simulate_temperature_override(self, event: SecurityEvent) -> bool:
        """Simulate temperature override (75% success rate)"""
        await asyncio.sleep(random.uniform(0.2, 0.5))
        
        # Success depends on severity
        if event.threat_level.value == 'critical':
            return random.random() > 0.35  # 65% success for critical
        
        return random.random() > 0.25  # 75% success for warning
    
    async def _simulate_access_lockdown(self, event: SecurityEvent) -> bool:
        """Simulate access lockdown (80% success rate)"""
        await asyncio.sleep(random.uniform(0.1, 0.25))
        
        return random.random() > 0.2  # 80% success
    
    def get_blocking_history(self, event_id: str) -> List[BlockingAttempt]:
        """Get blocking history for an event"""
        return self.blocking_history.get(event_id, [])
    
    def get_success_rate(self) -> float:
        """Get overall blocking success rate"""
        total = 0
        successful = 0
        
        for attempts in self.blocking_history.values():
            for attempt in attempts:
                total += 1
                if attempt.success:
                    successful += 1
        
        return (successful / total * 100) if total > 0 else 0.0
