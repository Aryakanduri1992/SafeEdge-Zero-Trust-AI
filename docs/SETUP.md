# SafeEdge Setup Guide

## Prerequisites

### System Requirements
- **Node.js** 18+ and npm
- **Python** 3.9+
- **Firebase** account
- **Kali Linux VM** (for security testing)
- **ESP32** development board (optional)

### Development Environment
- **Code Editor**: VS Code recommended
- **Terminal**: Bash/Zsh
- **Git**: For version control

## Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/safeedge.git
cd safeedge
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will be available at: http://localhost:9002

### 3. Backend Setup
```bash
# Navigate to backend directory
cd src/backend

# Install Python dependencies
pip install -r requirements.txt

# Start backend server
python3 main.py
```
Backend will be available at: http://localhost:8000

### 4. Firebase Configuration

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable **Realtime Database**
4. Enable **Authentication**
5. Create service account key

#### Environment Variables
Create `.env.local` file in project root:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Backend Configuration
FIREBASE_CREDENTIALS_PATH=path/to/serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

### 5. ESP32 Setup (Optional)

#### Hardware Requirements
- ESP32 development board
- DHT22 temperature/humidity sensor
- Breadboard and jumper wires
- USB cable

#### Arduino IDE Setup
1. Install [Arduino IDE](https://www.arduino.cc/en/software)
2. Add ESP32 board support:
   - File → Preferences
   - Add URL: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

#### Upload Firmware
1. Open `esp32_secure/SafeEdge_Final_Working.ino`
2. Configure WiFi credentials
3. Configure Firebase settings
4. Upload to ESP32

### 6. Kali Linux VM Setup

#### Download Kali Linux
1. Download from [Kali.org](https://www.kali.org/get-kali/#kali-virtual-machines)
2. Import into VirtualBox/VMware
3. Configure network (Bridged mode recommended)

#### Enable SSH
```bash
# In Kali VM terminal
sudo systemctl enable ssh
sudo systemctl start ssh

# Find IP address
ip addr show
```

#### Configure SafeEdge
1. Go to Security Center
2. Click "Open Terminal"
3. Enter Kali VM IP address
4. Use credentials: `kali`/`kali`

## Verification

### Test Frontend
1. Open http://localhost:9002
2. Login with test credentials
3. Navigate to Security Center
4. Verify dashboard loads

### Test Backend
1. Open http://localhost:8000/docs
2. Test API endpoints
3. Verify Firebase connection

### Test Kali Integration
1. Start Kali VM
2. Go to Security Center → Kali Terminal
3. Click "Connect"
4. Verify terminal connection

## Troubleshooting

### Common Issues

#### Frontend Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Backend Connection Error
- Check Python version: `python3 --version`
- Verify Firebase credentials
- Check port 8000 availability

#### Kali Terminal Connection Failed
- Verify Kali VM is running
- Check SSH service: `sudo systemctl status ssh`
- Verify IP address and credentials
- Test SSH manually: `ssh kali@[IP_ADDRESS]`

#### Firebase Permission Denied
- Check service account key permissions
- Verify database rules
- Ensure authentication is enabled

### Getting Help
- Check [GitHub Issues](https://github.com/yourusername/safeedge/issues)
- Review [API Documentation](API.md)
- Contact support: contact@safeedge.io

## Next Steps
- [Security Configuration](SECURITY.md)
- [Hardware Setup](HARDWARE.md)
- [API Documentation](API.md)