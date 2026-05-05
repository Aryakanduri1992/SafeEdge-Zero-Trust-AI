# SafeEdge - IoT Security Platform

SafeEdge is an enterprise-grade IoT security platform that provides real-time threat detection, encrypted data transmission, and professional security testing capabilities for hospital and healthcare environments.

## 🚀 Features

### Core Platform
- **Real-time Security Monitoring** - Live threat detection and analysis
- **Encrypted IoT Communication** - AES-256 encrypted sensor data transmission
- **Professional Security Testing** - Integrated Kali Linux terminal for penetration testing
- **3D Floor Plan Visualization** - Interactive building security overview
- **Mobile Device Provisioning** - BLE-based device onboarding
- **AI-Powered Threat Analysis** - Machine learning anomaly detection

### Security Tools Integration
- **Kali Linux Terminal** - Web-based access to professional security tools
- **Network Analysis** - Real-time packet capture and analysis
- **Vulnerability Scanning** - Automated security assessments
- **Penetration Testing** - Comprehensive security testing capabilities

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ESP32 Devices │    │   Web Platform  │    │  Kali Linux VM  │
│                 │    │                 │    │                 │
│ • Sensors       │◄──►│ • Dashboard     │◄──►│ • Security Tools│
│ • Encryption    │    │ • Analytics     │    │ • Penetration   │
│ • BLE Provision │    │ • 3D Visualization│  │ • Testing       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Firebase Cloud  │
                    │                 │
                    │ • Real-time DB  │
                    │ • Authentication│
                    │ • File Storage  │
                    └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Three.js** - 3D visualization
- **xterm.js** - Terminal emulation

### Backend
- **Python FastAPI** - High-performance API server
- **Firebase** - Real-time database and authentication
- **WebSocket** - Real-time communication
- **Paramiko** - SSH client for Kali integration

### IoT/Hardware
- **ESP32** - Microcontroller platform
- **Arduino IDE** - Firmware development
- **BLE** - Bluetooth Low Energy provisioning
- **AES-256** - Hardware encryption

### Security
- **Kali Linux** - Penetration testing platform
- **Wireshark** - Network protocol analyzer
- **Nmap** - Network discovery and security auditing
- **Custom Encryption** - End-to-end security

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Firebase account
- Kali Linux VM (for security testing)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/safeedge.git
cd safeedge
```

### 2. Frontend Setup
```bash
npm install
npm run dev
```
Frontend runs on: http://localhost:9002

### 3. Backend Setup
```bash
cd src/backend
pip install -r requirements.txt
python3 main.py
```
Backend runs on: http://localhost:8000

### 4. Firebase Configuration
1. Create Firebase project
2. Enable Realtime Database and Authentication
3. Add configuration to environment variables

### 5. ESP32 Setup
1. Open Arduino IDE
2. Load `esp32_secure/SafeEdge_Final_Working.ino`
3. Configure WiFi and Firebase credentials
4. Upload to ESP32 device

## 📱 Mobile App Setup

```bash
cd mobile-app/SafeEdgeProvisioning
npm install
npx expo start
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

### Kali Linux Integration
1. Set up Kali Linux VM
2. Enable SSH service
3. Configure network connectivity
4. Update IP address in Security Center

## 🏥 Use Cases

### Hospital Security
- **Patient Room Monitoring** - Temperature, humidity, motion detection
- **Medical Equipment Security** - Unauthorized access prevention
- **Network Security Testing** - Regular penetration testing
- **Compliance Monitoring** - HIPAA and healthcare regulations

### Enterprise IoT
- **Device Fleet Management** - Centralized monitoring and control
- **Security Incident Response** - Real-time threat detection and response
- **Vulnerability Assessment** - Automated security scanning
- **Audit Trail** - Comprehensive logging and reporting

## 🔒 Security Features

### Device Level
- **Hardware Encryption** - AES-256 encryption on ESP32
- **Secure Boot** - Verified firmware loading
- **Certificate-based Authentication** - X.509 certificates
- **Over-the-Air Updates** - Secure firmware updates

### Platform Level
- **End-to-End Encryption** - Data encrypted in transit and at rest
- **Role-based Access Control** - Granular permissions
- **Security Analytics** - AI-powered threat detection
- **Penetration Testing** - Integrated Kali Linux tools

## 📊 Dashboard Features

### Real-time Monitoring
- Live sensor data visualization
- Interactive 3D floor plans
- Threat level indicators
- Device status monitoring

### Security Analytics
- Historical data analysis
- Anomaly detection
- Threat intelligence
- Compliance reporting

### Professional Tools
- Kali Linux terminal access
- Network analysis tools
- Vulnerability scanners
- Penetration testing suite

## 🏆 Competition Highlights

### Innovation
- **First IoT platform** with integrated Kali Linux terminal
- **Real-time 3D visualization** of security threats
- **Mobile BLE provisioning** for easy device setup
- **AI-powered threat detection** with custom algorithms

### Technical Excellence
- **Enterprise-grade security** with hardware encryption
- **Scalable architecture** supporting thousands of devices
- **Professional security tools** integration
- **Comprehensive documentation** and setup guides

### Impact
- **Healthcare security** improvement
- **IoT vulnerability** reduction
- **Security professional** empowerment
- **Industry standard** establishment

## 📚 Documentation

- [Setup Guide](docs/SETUP.md)
- [API Documentation](docs/API.md)
- [Security Guide](docs/SECURITY.md)
- [Hardware Guide](docs/HARDWARE.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

⚠️ **All Rights Reserved**

This project is publicly visible for **educational and portfolio purposes only**.

**Unauthorized use, copying, modification, or distribution of this code is strictly prohibited.**

For licensing inquiries or collaboration opportunities, contact: **contact@safeedge.io**

---

**Built with ❤️ for a more secure IoT world**

**© 2026 SafeEdge Security Team. All Rights Reserved.**
