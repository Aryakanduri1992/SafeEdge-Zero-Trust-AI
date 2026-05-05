# SafeEdge Professional Demo Infrastructure
**Task 7.1: Physical demo infrastructure for Imagine Cup 2026**

## 🏥 Hospital NICU Simulation Setup

### Physical Layout Design
```
┌─────────────────────────────────────────────────────────────┐
│                    SafeEdge Demo Setup                      │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Ward A    │    │  Corridor   │    │   Ward B    │    │
│  │             │    │             │    │             │    │
│  │ ┌─────────┐ │    │             │    │ ┌─────────┐ │    │
│  │ │Room 101 │ │    │   Control   │    │ │Room 201 │ │    │
│  │ │ESP32 #1 │ │    │   Station   │    │ │ESP32 #3 │ │    │
│  │ │🔴🟡🟢   │ │    │             │    │ │🔴🟡🟢   │ │    │
│  │ └─────────┘ │    │  ┌───────┐  │    │ └─────────┘ │    │
│  │             │    │  │Laptop │  │    │             │    │
│  │ ┌─────────┐ │    │  │Monitor│  │    │             │    │
│  │ │Room 102 │ │    │  └───────┘  │    │             │    │
│  │ │ESP32 #2 │ │    │             │    │             │    │
│  │ │🔴🟡🟢   │ │    │             │    │             │    │
│  │ └─────────┘ │    │             │    │             │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                             │
│  Legend:                                                    │
│  🔴 Critical Alert LED    🟡 Warning LED    🟢 Safe LED    │
│  📱 ESP32 Device         💻 Control Station                │
└─────────────────────────────────────────────────────────────┘
```

### ESP32 Enclosure Design Specifications

#### Professional Enclosure Features
- **Material**: White ABS plastic with medical-grade finish
- **Dimensions**: 120mm x 80mm x 40mm
- **Mounting**: Wall-mount brackets with hospital-standard spacing
- **Branding**: SafeEdge logo with blue accent lighting
- **Ventilation**: Passive cooling vents for ESP32 heat dissipation
- **Cable Management**: Professional cable routing with strain relief

#### LED Indicator Layout
```
┌─────────────────────────────────┐
│        SafeEdge Logo            │
│                                 │
│  🟢 SAFE    🟡 WARNING   🔴 CRITICAL │
│                                 │
│         🔴 ATTACK               │
│      (Flashing Red)             │
│                                 │
│  Device: NICU-001               │
│  Status: PROTECTED              │
└─────────────────────────────────┘
```

#### Sensor Integration Points
1. **DHT22 Housing**: Ventilated chamber for accurate readings
2. **PIR Sensor**: Discrete motion detection window
3. **Accelerometer**: Internal mounting for vibration detection
4. **Analog Sensors**: Professional probe connections
5. **Reed Switch**: Magnetic door/panel monitoring
6. **Microphone**: Sound level detection grille

### Demo Kit Components

#### Portable Demo Case
- **Case**: Pelican-style protective case (24" x 18" x 8")
- **Foam Insert**: Custom-cut foam for component protection
- **Power**: Integrated 12V battery system with 8-hour runtime
- **Networking**: Portable WiFi router with SafeEdge_Demo SSID
- **Backup**: 4G LTE hotspot for internet connectivity

#### Component Inventory
```
Hardware Components:
├── 3x ESP32 DevKit v1 (Pre-programmed)
├── 3x Professional Enclosures (SafeEdge Branded)
├── 3x DHT22 Temperature/Humidity Sensors
├── 3x PIR Motion Sensors
├── 3x ADXL345 Accelerometers
├── 9x Analog Sensors (O2, CO2, Power)
├── 3x Reed Switches
├── 3x Microphones
├── 12x Status LEDs (RGB)
├── 1x Portable WiFi Router
├── 1x 4G LTE Hotspot
├── 1x 12V Battery Pack (20Ah)
├── 3x Wall Mount Brackets
├── 1x Control Laptop (Pre-configured)
└── Cables & Accessories

Presentation Materials:
├── SafeEdge Backdrop Banner (8ft x 6ft)
├── Professional Brochures (50 copies)
├── Business Cards (100 cards)
├── Demo Script Cards
├── Judge Handout Packets
├── Technical Specification Sheets
└── Competition Submission Materials
```

### Setup Instructions

#### Quick Setup (5 minutes)
1. **Unfold backdrop banner** behind demo area
2. **Mount ESP32 enclosures** on provided stands
3. **Connect power** from battery pack to all devices
4. **Start WiFi router** and verify network connectivity
5. **Boot control laptop** and launch dashboard
6. **Verify device status** - all LEDs should show green
7. **Test attack simulation** with one scenario

#### Detailed Setup (15 minutes)
1. **Physical Layout**
   - Position Ward A and Ward B areas 6 feet apart
   - Place control station in center corridor position
   - Ensure clear sight lines for judge viewing
   - Set up professional lighting if available

2. **Device Configuration**
   - Power on ESP32 devices in sequence
   - Verify WiFi connections (check signal strength)
   - Confirm Firebase connectivity
   - Test all sensor readings
   - Calibrate LED brightness for venue lighting

3. **Software Preparation**
   - Launch enhanced security dashboard
   - Verify real-time data updates
   - Test attack simulation triggers
   - Prepare presentation mode
   - Load judge demonstration script

4. **Safety Checks**
   - Verify all safety limits are active
   - Test emergency stop procedures
   - Confirm backup systems are ready
   - Check battery levels (>80% recommended)
   - Validate network redundancy

### Demo Scenarios

#### Scenario 1: Temperature Attack (45 seconds)
**Trigger**: Software command or dashboard button
**Simulation**: 
- Temperature rises from 37°C to 45°C over 30 seconds
- Critical LED flashing, attack LED active
- AI analysis: "Emergency cooling protocol activated"
- Voice alert: "Critical temperature detected - patient safety systems engaged"
- Recovery: Automatic return to 37°C in 15 seconds

#### Scenario 2: Access Attack (30 seconds)
**Trigger**: Reed switch activation or software simulation
**Simulation**:
- Motion detection + door opening
- Warning LED active, vibration sensors triggered
- AI analysis: "Unauthorized access - security protocols active"
- Voice alert: "Access breach detected - security team notified"
- Recovery: Automatic reset after 30 seconds

#### Scenario 3: Power Attack (35 seconds)
**Trigger**: Software voltage simulation
**Simulation**:
- Power voltage drops from 12V to 8V
- Critical LED flashing, backup systems activate
- AI analysis: "Power supply attack - UPS systems engaged"
- Voice alert: "Power anomaly detected - backup systems active"
- Recovery: Voltage restoration in 35 seconds

#### Scenario 4: Network Attack (40 seconds)
**Trigger**: WiFi signal manipulation
**Simulation**:
- Signal strength drops to -90dBm
- Warning LED active, connectivity issues
- AI analysis: "Network interference - security measures active"
- Voice alert: "Network anomaly detected - investigating source"
- Recovery: Signal restoration in 40 seconds

### Safety Protocols

#### Hardware Safety Limits
- **Temperature**: Absolute max 42°C, min 32°C
- **Power**: Automatic shutdown if voltage <6V or >16V
- **Motion**: No actual physical hazards
- **Network**: Isolated demo network only

#### Emergency Procedures
1. **Immediate Stop**: Press red emergency button on control laptop
2. **Power Disconnect**: Main battery disconnect switch
3. **Network Isolation**: WiFi router power switch
4. **Device Reset**: Individual ESP32 reset buttons
5. **Full Recovery**: Complete system restart (2 minutes)

#### Backup Systems
- **Power**: Dual battery packs with automatic switching
- **Network**: 4G LTE hotspot as WiFi backup
- **Devices**: Spare ESP32 with identical configuration
- **Laptop**: Backup laptop with identical software
- **Presentation**: USB drives with offline demo materials

### Transportation Guidelines

#### Packing Checklist
- [ ] All devices powered down and disconnected
- [ ] Batteries removed and packed separately
- [ ] Fragile components in protective foam
- [ ] Cables organized in labeled bags
- [ ] Backup materials in separate case
- [ ] Documentation and scripts printed
- [ ] Competition submission materials ready

#### Shipping Considerations
- **Case Weight**: <50 lbs for airline carry-on compliance
- **Battery Regulations**: Lithium batteries in carry-on only
- **International Travel**: Customs documentation ready
- **Insurance**: Equipment coverage for full replacement value
- **Tracking**: GPS tracker in case for security

### Venue Setup Requirements

#### Space Requirements
- **Minimum Area**: 10ft x 8ft demonstration space
- **Power**: 2x 110V outlets (backup battery available)
- **Network**: WiFi available (4G backup included)
- **Lighting**: Adequate for LED visibility
- **Acoustics**: Quiet enough for voice alerts

#### Judge Accommodation
- **Viewing Distance**: 3-6 feet optimal
- **Seating**: 3-5 judges maximum
- **Interaction**: Touch-screen demo control available
- **Materials**: Handout packets for each judge
- **Questions**: Technical expert available for Q&A

### Maintenance & Troubleshooting

#### Pre-Demo Checklist (30 minutes before)
- [ ] Battery levels >80%
- [ ] WiFi connectivity confirmed
- [ ] All LEDs functional
- [ ] Sensor readings normal
- [ ] Attack simulations tested
- [ ] Voice alerts working
- [ ] Dashboard responsive
- [ ] Backup systems ready

#### Common Issues & Solutions
1. **WiFi Connection Failed**
   - Switch to 4G LTE hotspot
   - Check router power and settings
   - Verify device credentials

2. **Sensor Reading Errors**
   - Check physical connections
   - Restart affected ESP32
   - Use backup device if needed

3. **LED Not Working**
   - Check power connections
   - Verify GPIO pin assignments
   - Replace LED if necessary

4. **Attack Simulation Stuck**
   - Send STOP_ATTACK command
   - Reset device if needed
   - Use manual recovery procedure

#### Post-Demo Procedures
- [ ] Power down all devices
- [ ] Disconnect all cables
- [ ] Pack components securely
- [ ] Charge batteries for next demo
- [ ] Update demo statistics
- [ ] Backup any new data
- [ ] Clean and inspect equipment

---

**Demo Infrastructure Status**: ✅ READY FOR COMPETITION  
**Setup Time**: 5-15 minutes depending on venue  
**Demo Duration**: 3-10 minutes (configurable)  
**Safety Rating**: Hospital-grade with multiple redundancies  
**Judge Impact**: Maximum visual and technical impression  

This professional demo infrastructure is designed to create the "wow factor" that wins competitions! 🏆