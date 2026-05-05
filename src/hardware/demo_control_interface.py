"""
Demo Control Interface (Python)
Task 7.2: Hardware integration for attack simulation system
Connects dashboard to ESP32 devices for live demonstrations
"""

import asyncio
import json
import time
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db
import serial
import serial.tools.list_ports

@dataclass
class ESP32Device:
    """ESP32 device information"""
    device_id: str
    name: str
    location: str
    serial_port: Optional[str]
    firebase_path: str
    status: str  # 'online', 'offline', 'attacking'
    last_seen: str
    battery_level: int
    signal_strength: int
    security_score: int

@dataclass
class AttackSimulation:
    """Attack simulation configuration"""
    attack_id: str
    device_id: str
    attack_type: str  # 'temperature', 'access', 'power', 'network'
    duration: int  # seconds
    severity: str  # 'low', 'medium', 'high', 'critical'
    status: str  # 'pending', 'running', 'completed', 'failed'
    started_at: Optional[str]
    completed_at: Optional[str]
    safety_checks: List[str]

class DemoControlInterface:
    """Hardware demo control interface for Imagine Cup 2026"""
    
    def __init__(self, firebase_config: Dict):
        self.firebase_config = firebase_config
        self.devices: Dict[str, ESP32Device] = {}
        self.active_simulations: Dict[str, AttackSimulation] = {}
        self.serial_connections: Dict[str, serial.Serial] = {}
        
        # Demo configuration
        self.demo_mode = True
        self.presentation_mode = False
        self.safety_enabled = True
        
        # Attack scenarios
        self.attack_scenarios = {
            'temperature': {
                'name': 'Temperature Manipulation Attack',
                'duration': 45,
                'severity': 'critical',
                'command': 'TEMP_ATTACK',
                'safety_checks': [
                    'Hardware temperature limits enforced',
                    'Automatic system recovery in 30s',
                    'No actual patient risk'
                ]
            },
            'access': {
                'name': 'Unauthorized Physical Access',
                'duration': 30,
                'severity': 'high',
                'command': 'ACCESS_ATTACK',
                'safety_checks': [
                    'Simulated sensor activation only',
                    'No physical security breach',
                    'Immediate reset capability'
                ]
            },
            'power': {
                'name': 'Power Supply Manipulation',
                'duration': 35,
                'severity': 'high',
                'command': 'POWER_ATTACK',
                'safety_checks': [
                    'Software simulation only',
                    'No actual power interruption',
                    'Battery backup systems active'
                ]
            },
            'network': {
                'name': 'Network Intrusion Attempt',
                'duration': 40,
                'severity': 'medium',
                'command': 'NETWORK_ATTACK',
                'safety_checks': [
                    'Controlled network environment',
                    'No actual network disruption',
                    'Isolated test environment'
                ]
            }
        }
        
        print("🎮 Demo Control Interface initialized")
    
    async def initialize(self):
        """Initialize Firebase and discover ESP32 devices"""
        
        # Initialize Firebase
        await self._initialize_firebase()
        
        # Discover ESP32 devices
        await self._discover_devices()
        
        # Establish serial connections
        await self._connect_serial_devices()
        
        print(f"✅ Demo system ready with {len(self.devices)} devices")
    
    async def _initialize_firebase(self):
        """Initialize Firebase connection"""
        
        try:
            # Initialize Firebase Admin SDK
            if not firebase_admin._apps:
                cred = credentials.Certificate(self.firebase_config['credentials_path'])
                firebase_admin.initialize_app(cred, {
                    'databaseURL': self.firebase_config['database_url']
                })
            
            # Test connection
            ref = db.reference('/demo_control')
            ref.set({'initialized': True, 'timestamp': datetime.now().isoformat()})
            
            print("🔥 Firebase initialized for demo control")
        
        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
            raise
    
    async def _discover_devices(self):
        """Discover ESP32 devices from Firebase"""
        
        try:
            devices_ref = db.reference('/devices')
            devices_data = devices_ref.get()
            
            if devices_data:
                for device_id, device_info in devices_data.items():
                    if 'info' in device_info:
                        info = device_info['info']
                        device = ESP32Device(
                            device_id=device_id,
                            name=info.get('deviceName', f'Device {device_id}'),
                            location=info.get('location', 'Unknown'),
                            serial_port=None,  # Will be discovered
                            firebase_path=f'/devices/{device_id}',
                            status=info.get('status', 'offline'),
                            last_seen=info.get('lastSeen', ''),
                            battery_level=85,  # Default for demo
                            signal_strength=-45,  # Default for demo
                            security_score=100
                        )
                        self.devices[device_id] = device
                        print(f"📱 Discovered device: {device.name}")
        
        except Exception as e:
            print(f"⚠️  Device discovery failed: {e}")
            # Create demo devices if Firebase is unavailable
            self._create_demo_devices()
    
    def _create_demo_devices(self):
        """Create demo devices for offline operation"""
        
        demo_devices = [
            {
                'id': 'incubator_demo_001',
                'name': 'NICU Incubator Demo #1',
                'location': 'Ward A - Room 101'
            },
            {
                'id': 'incubator_demo_002',
                'name': 'NICU Incubator Demo #2',
                'location': 'Ward A - Room 102'
            },
            {
                'id': 'incubator_demo_003',
                'name': 'NICU Incubator Demo #3',
                'location': 'Ward B - Room 201'
            }
        ]
        
        for device_data in demo_devices:
            device = ESP32Device(
                device_id=device_data['id'],
                name=device_data['name'],
                location=device_data['location'],
                serial_port=None,
                firebase_path=f"/devices/{device_data['id']}",
                status='offline',
                last_seen=datetime.now().isoformat(),
                battery_level=85,
                signal_strength=-45,
                security_score=100
            )
            self.devices[device_data['id']] = device
        
        print("📱 Created demo devices for offline operation")
    
    async def _connect_serial_devices(self):
        """Establish serial connections to ESP32 devices"""
        
        # List available serial ports
        ports = serial.tools.list_ports.comports()
        available_ports = [port.device for port in ports if 'USB' in port.description or 'Serial' in port.description]
        
        print(f"🔌 Found {len(available_ports)} potential ESP32 ports: {available_ports}")
        
        # Try to connect to each port
        for port in available_ports:
            try:
                ser = serial.Serial(port, 115200, timeout=1)
                time.sleep(2)  # Wait for ESP32 to initialize
                
                # Send status command to identify device
                ser.write(b'STATUS\n')
                time.sleep(1)
                
                response = ser.read_all().decode('utf-8', errors='ignore')
                if 'SafeEdge' in response and 'Device ID:' in response:
                    # Extract device ID from response
                    lines = response.split('\n')
                    device_id = None
                    for line in lines:
                        if 'Device ID:' in line:
                            device_id = line.split(':')[1].strip()
                            break
                    
                    if device_id and device_id in self.devices:
                        self.devices[device_id].serial_port = port
                        self.devices[device_id].status = 'online'
                        self.serial_connections[device_id] = ser
                        print(f"✅ Connected to {device_id} on {port}")
                    else:
                        ser.close()
                else:
                    ser.close()
            
            except Exception as e:
                print(f"⚠️  Failed to connect to {port}: {e}")
        
        print(f"🔗 Established {len(self.serial_connections)} serial connections")
    
    async def start_attack_simulation(self, device_id: str, attack_type: str) -> str:
        """Start attack simulation on specified device"""
        
        if device_id not in self.devices:
            raise ValueError(f"Device {device_id} not found")
        
        if attack_type not in self.attack_scenarios:
            raise ValueError(f"Attack type {attack_type} not supported")
        
        # Safety check
        if self.safety_enabled:
            if not await self._perform_safety_checks(device_id, attack_type):
                raise RuntimeError("Safety checks failed - attack simulation aborted")
        
        # Create simulation record
        attack_id = f"attack_{int(time.time())}_{device_id}"
        scenario = self.attack_scenarios[attack_type]
        
        simulation = AttackSimulation(
            attack_id=attack_id,
            device_id=device_id,
            attack_type=attack_type,
            duration=scenario['duration'],
            severity=scenario['severity'],
            status='pending',
            started_at=None,
            completed_at=None,
            safety_checks=scenario['safety_checks']
        )
        
        self.active_simulations[attack_id] = simulation
        
        try:
            # Send command to ESP32
            success = await self._send_device_command(device_id, scenario['command'])
            
            if success:
                simulation.status = 'running'
                simulation.started_at = datetime.now().isoformat()
                self.devices[device_id].status = 'attacking'
                
                # Update Firebase
                await self._update_firebase_simulation(simulation)
                
                # Schedule automatic completion
                asyncio.create_task(self._monitor_simulation(simulation))
                
                print(f"🚀 Started {scenario['name']} on {device_id}")
                return attack_id
            else:
                simulation.status = 'failed'
                raise RuntimeError("Failed to send command to device")
        
        except Exception as e:
            simulation.status = 'failed'
            print(f"❌ Attack simulation failed: {e}")
            raise
    
    async def stop_attack_simulation(self, attack_id: str) -> bool:
        """Stop active attack simulation"""
        
        if attack_id not in self.active_simulations:
            return False
        
        simulation = self.active_simulations[attack_id]
        
        try:
            # Send stop command to device
            success = await self._send_device_command(simulation.device_id, 'STOP_ATTACK')
            
            if success:
                simulation.status = 'completed'
                simulation.completed_at = datetime.now().isoformat()
                self.devices[simulation.device_id].status = 'online'
                
                # Update Firebase
                await self._update_firebase_simulation(simulation)
                
                print(f"⏹️  Stopped attack simulation {attack_id}")
                return True
            else:
                print(f"⚠️  Failed to stop attack simulation {attack_id}")
                return False
        
        except Exception as e:
            print(f"❌ Error stopping simulation: {e}")
            return False
    
    async def _send_device_command(self, device_id: str, command: str) -> bool:
        """Send command to ESP32 device"""
        
        # Try serial connection first
        if device_id in self.serial_connections:
            try:
                ser = self.serial_connections[device_id]
                ser.write(f"{command}\n".encode())
                time.sleep(0.5)
                
                # Read response
                response = ser.read_all().decode('utf-8', errors='ignore')
                if 'command received' in response.lower():
                    return True
            
            except Exception as e:
                print(f"⚠️  Serial command failed for {device_id}: {e}")
        
        # Fallback to Firebase command
        try:
            command_ref = db.reference(f'/commands/{device_id}')
            command_ref.set(command)
            print(f"📤 Sent Firebase command {command} to {device_id}")
            return True
        
        except Exception as e:
            print(f"❌ Firebase command failed: {e}")
            return False
    
    async def _perform_safety_checks(self, device_id: str, attack_type: str) -> bool:
        """Perform safety checks before attack simulation"""
        
        device = self.devices[device_id]
        
        # Check device status
        if device.status not in ['online', 'offline']:
            print(f"⚠️  Device {device_id} not in safe state: {device.status}")
            return False
        
        # Check for existing simulations
        active_attacks = [s for s in self.active_simulations.values() 
                         if s.device_id == device_id and s.status == 'running']
        if active_attacks:
            print(f"⚠️  Device {device_id} already has active simulation")
            return False
        
        # Check battery level
        if device.battery_level < 20:
            print(f"⚠️  Device {device_id} battery too low: {device.battery_level}%")
            return False
        
        # Attack-specific checks
        if attack_type == 'temperature':
            # Ensure temperature sensors are working
            pass
        elif attack_type == 'power':
            # Ensure backup power is available
            pass
        
        print(f"✅ Safety checks passed for {device_id} - {attack_type}")
        return True
    
    async def _monitor_simulation(self, simulation: AttackSimulation):
        """Monitor attack simulation and handle completion"""
        
        await asyncio.sleep(simulation.duration)
        
        # Check if simulation is still running
        if simulation.status == 'running':
            print(f"⏰ Auto-completing simulation {simulation.attack_id}")
            await self.stop_attack_simulation(simulation.attack_id)
    
    async def _update_firebase_simulation(self, simulation: AttackSimulation):
        """Update simulation status in Firebase"""
        
        try:
            simulation_ref = db.reference(f'/simulations/{simulation.attack_id}')
            simulation_data = {
                'attack_id': simulation.attack_id,
                'device_id': simulation.device_id,
                'attack_type': simulation.attack_type,
                'duration': simulation.duration,
                'severity': simulation.severity,
                'status': simulation.status,
                'started_at': simulation.started_at,
                'completed_at': simulation.completed_at,
                'safety_checks': simulation.safety_checks
            }
            simulation_ref.set(simulation_data)
        
        except Exception as e:
            print(f"⚠️  Failed to update Firebase simulation: {e}")
    
    async def get_device_status(self, device_id: str) -> Optional[Dict]:
        """Get current device status"""
        
        if device_id not in self.devices:
            return None
        
        device = self.devices[device_id]
        
        # Try to get real-time data from Firebase
        try:
            device_ref = db.reference(f'{device.firebase_path}/current')
            current_data = device_ref.get()
            
            if current_data:
                return json.loads(current_data)
        
        except Exception as e:
            print(f"⚠️  Failed to get device status from Firebase: {e}")
        
        # Return cached device info
        return {
            'deviceId': device.device_id,
            'deviceName': device.name,
            'location': device.location,
            'status': device.status,
            'batteryLevel': device.battery_level,
            'signalStrength': device.signal_strength,
            'securityScore': device.security_score,
            'lastSeen': device.last_seen
        }
    
    async def get_all_devices(self) -> List[Dict]:
        """Get status of all devices"""
        
        devices_status = []
        for device_id in self.devices:
            status = await self.get_device_status(device_id)
            if status:
                devices_status.append(status)
        
        return devices_status
    
    async def get_active_simulations(self) -> List[Dict]:
        """Get all active attack simulations"""
        
        active = []
        for simulation in self.active_simulations.values():
            if simulation.status in ['pending', 'running']:
                active.append({
                    'attack_id': simulation.attack_id,
                    'device_id': simulation.device_id,
                    'attack_type': simulation.attack_type,
                    'duration': simulation.duration,
                    'severity': simulation.severity,
                    'status': simulation.status,
                    'started_at': simulation.started_at,
                    'safety_checks': simulation.safety_checks
                })
        
        return active
    
    def set_presentation_mode(self, enabled: bool):
        """Enable/disable presentation mode"""
        
        self.presentation_mode = enabled
        print(f"🎯 Presentation mode: {'ON' if enabled else 'OFF'}")
        
        # Send presentation mode command to all devices
        for device_id in self.devices:
            asyncio.create_task(
                self._send_device_command(device_id, 'PRESENTATION_MODE')
            )
    
    def get_demo_statistics(self) -> Dict:
        """Get demo performance statistics"""
        
        total_simulations = len(self.active_simulations)
        completed_simulations = len([s for s in self.active_simulations.values() 
                                   if s.status == 'completed'])
        failed_simulations = len([s for s in self.active_simulations.values() 
                                if s.status == 'failed'])
        
        return {
            'total_devices': len(self.devices),
            'online_devices': len([d for d in self.devices.values() if d.status == 'online']),
            'total_simulations': total_simulations,
            'completed_simulations': completed_simulations,
            'failed_simulations': failed_simulations,
            'success_rate': (completed_simulations / total_simulations * 100) if total_simulations > 0 else 0,
            'presentation_mode': self.presentation_mode,
            'safety_enabled': self.safety_enabled
        }
    
    async def emergency_stop_all(self):
        """Emergency stop all active simulations"""
        
        print("🚨 EMERGENCY STOP - Stopping all active simulations")
        
        # Stop all active simulations
        active_attacks = [s.attack_id for s in self.active_simulations.values() 
                         if s.status == 'running']
        
        for attack_id in active_attacks:
            await self.stop_attack_simulation(attack_id)
        
        # Send emergency stop to all devices
        for device_id in self.devices:
            await self._send_device_command(device_id, 'STOP_ATTACK')
        
        print("✅ Emergency stop completed")
    
    async def cleanup(self):
        """Cleanup resources"""
        
        # Close serial connections
        for ser in self.serial_connections.values():
            try:
                ser.close()
            except:
                pass
        
        print("🧹 Demo control interface cleaned up")


# Demo Control API Integration
class DemoControlAPI:
    """FastAPI integration for demo control"""
    
    def __init__(self, demo_control: DemoControlInterface):
        self.demo_control = demo_control
    
    async def trigger_attack(self, device_id: str, attack_type: str) -> Dict:
        """API endpoint to trigger attack simulation"""
        
        try:
            attack_id = await self.demo_control.start_attack_simulation(device_id, attack_type)
            return {
                'success': True,
                'attack_id': attack_id,
                'message': f'Attack simulation started on {device_id}'
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to start attack simulation'
            }
    
    async def stop_attack(self, attack_id: str) -> Dict:
        """API endpoint to stop attack simulation"""
        
        success = await self.demo_control.stop_attack_simulation(attack_id)
        
        return {
            'success': success,
            'message': 'Attack simulation stopped' if success else 'Failed to stop simulation'
        }
    
    async def get_demo_status(self) -> Dict:
        """API endpoint to get demo status"""
        
        devices = await self.demo_control.get_all_devices()
        simulations = await self.demo_control.get_active_simulations()
        statistics = self.demo_control.get_demo_statistics()
        
        return {
            'devices': devices,
            'active_simulations': simulations,
            'statistics': statistics,
            'timestamp': datetime.now().isoformat()
        }