# Laptop 2 Setup Instructions - SafeEdge IoT Simulator

## Quick Setup for Imagine Cup 2026 Demo

### Step 1: Verify Current Setup
Your Laptop 2 should already have:
- ✅ `laptop2_provisioned_device.py` (working script)
- ✅ Python 3 with required packages
- ✅ Network connection to Laptop 1 backend

### Step 2: Open Kiro on Laptop 2
1. Open Kiro IDE on Laptop 2
2. Navigate to the folder containing `laptop2_provisioned_device.py`

### Step 3: Upload Files to Kiro
Upload these files to Kiro:
1. **`LAPTOP2_KIRO_PROMPT.md`** - The main prompt for creating GUI
2. **`laptop2_provisioned_device.py`** - Your existing working script

### Step 4: Give Kiro the Command
Copy and paste this exact message to Kiro:

```
I have a working Python script laptop2_provisioned_device.py that sends encrypted IoT sensor data to my backend API. I need you to create a GUI wrapper around this existing script.

Please read the LAPTOP2_KIRO_PROMPT.md file for detailed requirements. The key points are:

1. DO NOT modify the existing laptop2_provisioned_device.py script
2. Create a new file laptop2_gui_simulator.py that imports and uses the existing classes
3. Add a tkinter GUI with Start/Stop buttons and Attack simulation
4. Show real-time sensor readings and statistics
5. Make it ready for Imagine Cup 2026 demonstration

The existing script is working perfectly - I just need a user-friendly GUI on top of it.
```

### Step 5: Expected Output
Kiro will create:
- `laptop2_gui_simulator.py` - New GUI application
- Instructions for running the GUI
- Any additional helper files needed

### Step 6: Test the GUI
1. Run: `python3 laptop2_gui_simulator.py`
2. Click "START SIMULATION" to begin normal data
3. Click "ATTACK MODE" to simulate security threats
4. Verify data appears in the web dashboard on Laptop 1

### Step 7: Demo Preparation
For the Imagine Cup presentation:
1. Have the GUI ready on Laptop 2
2. Have the web dashboard open on Laptop 1
3. Start with device showing "Offline"
4. Click "START SIMULATION" → Device goes "Online"
5. Click "ATTACK MODE" → Show security threat detection
6. Demonstrate real-time encrypted data flow

## Troubleshooting

### If GUI doesn't start:
```bash
pip3 install tkinter requests cryptography
```

### If connection fails:
- Check backend IP: `ping 192.168.206.105`
- Verify backend is running on Laptop 1
- Test original script: `python3 laptop2_provisioned_device.py`

### If Kiro needs clarification:
Show Kiro the existing `laptop2_provisioned_device.py` file and ask it to:
1. Analyze the existing classes and functions
2. Create a GUI that imports and uses them
3. Add attack simulation by modifying sensor data generation
4. Keep all encryption and networking code unchanged

## Success Indicators
- ✅ GUI opens without errors
- ✅ Start button begins data transmission
- ✅ Real-time sensor values update in GUI
- ✅ Attack mode generates anomalous data
- ✅ Web dashboard shows device online and receives data
- ✅ Statistics update correctly

Ready for Imagine Cup 2026! 🏆