# Kali Linux VM Setup Guide for SafeEdge Security Center

## 🎯 Overview
This guide will help you set up a Kali Linux VM that integrates with the SafeEdge Security Center terminal interface.

## 📋 Prerequisites
- VirtualBox, VMware, or similar virtualization software
- At least 8GB RAM available for VM
- 50GB+ free disk space
- Network connectivity

## 🚀 Quick Setup Options

### Option 1: Download Pre-built Kali VM (Recommended)

#### Step 1: Download Kali Linux VM
```bash
# Download official Kali VM (choose your virtualization platform)
# VMware:
wget https://cdimage.kali.org/kali-2024.1/kali-linux-2024.1-vmware-amd64.7z

# VirtualBox:
wget https://cdimage.kali.org/kali-2024.1/kali-linux-2024.1-virtualbox-amd64.7z

# Extract the archive
7z x kali-linux-2024.1-vmware-amd64.7z
```

#### Step 2: VM Configuration
```bash
# Recommended VM settings:
- RAM: 4GB minimum, 8GB recommended
- CPU: 2-4 cores
- Storage: 50GB minimum
- Network: Bridged Adapter (for direct network access)
```

#### Step 3: Import and Start VM
1. Import the VM into your virtualization software
2. Start the VM
3. Default credentials: `kali` / `kali`

### Option 2: Docker Kali Container (Alternative)

#### Create Kali Docker Container
```dockerfile
# Create Dockerfile
FROM kalilinux/kali-rolling

# Update and install essential tools
RUN apt update && apt install -y \
    openssh-server \
    sudo \
    nano \
    vim \
    curl \
    wget \
    net-tools \
    iputils-ping \
    nmap \
    wireshark \
    tshark \
    nikto \
    sqlmap \
    metasploit-framework \
    john \
    hashcat \
    aircrack-ng \
    gobuster \
    hydra \
    burpsuite \
    && rm -rf /var/lib/apt/lists/*

# Configure SSH
RUN mkdir /var/run/sshd
RUN echo 'root:kali' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Create safeedge user
RUN useradd -m -s /bin/bash safeedge
RUN echo 'safeedge:kali' | chpasswd
RUN usermod -aG sudo safeedge

EXPOSE 22

CMD ["/usr/sbin/sshd", "-D"]
```

#### Build and Run Container
```bash
# Build container
docker build -t safeedge-kali .

# Run container with SSH access
docker run -d -p 2222:22 --name kali-vm safeedge-kali

# Test SSH connection
ssh safeedge@localhost -p 2222
```

## 🔧 Kali VM Configuration

### Step 1: Initial Setup
```bash
# SSH into your Kali VM
ssh kali@<kali-vm-ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install additional tools if needed
sudo apt install -y kali-linux-default
```

### Step 2: Create SafeEdge User
```bash
# Create dedicated user for SafeEdge
sudo useradd -m -s /bin/bash safeedge
sudo usermod -aG sudo safeedge

# Set password
sudo passwd safeedge
# Enter: kali (or your preferred password)
```

### Step 3: Configure SSH Access
```bash
# Enable SSH service
sudo systemctl enable ssh
sudo systemctl start ssh

# Configure SSH for key-based authentication (recommended)
sudo mkdir -p /home/safeedge/.ssh
sudo chown safeedge:safeedge /home/safeedge/.ssh
sudo chmod 700 /home/safeedge/.ssh

# Generate SSH key pair (run on your host machine)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/safeedge_kali -N ""

# Copy public key to Kali VM
ssh-copy-id -i ~/.ssh/safeedge_kali.pub safeedge@<kali-vm-ip>

# Test key-based authentication
ssh -i ~/.ssh/safeedge_kali safeedge@<kali-vm-ip>
```

### Step 4: Network Configuration
```bash
# Find VM IP address
ip addr show

# Configure firewall (if needed)
sudo ufw allow ssh
sudo ufw enable

# For VirtualBox with NAT, set up port forwarding:
VBoxManage modifyvm "Kali-VM" --natpf1 "SSH,tcp,,2222,,22"
```

### Step 5: Install Security Tools
```bash
# Install comprehensive tool suite
sudo apt install -y \
    nmap \
    masscan \
    wireshark \
    tshark \
    nikto \
    gobuster \
    dirb \
    sqlmap \
    metasploit-framework \
    john \
    hashcat \
    hydra \
    medusa \
    aircrack-ng \
    reaver \
    kismet \
    burpsuite \
    zaproxy \
    whatweb \
    theharvester \
    dnsrecon \
    fierce \
    netdiscover \
    arp-scan \
    enum4linux \
    smbclient \
    nbtscan \
    onesixtyone \
    snmpwalk \
    searchsploit \
    exploitdb

# Initialize Metasploit database
sudo msfdb init

# Update exploit database
sudo searchsploit -u
```

## 🔗 SafeEdge Integration

### Step 1: Update Backend Configuration
```python
# In src/backend/main.py, update the Kali VM host
init_kali_terminal_server(app, kali_host='192.168.1.100')  # Your Kali VM IP
```

### Step 2: Test Connection
```bash
# Start SafeEdge backend
cd src/backend
python3 main.py

# In another terminal, test WebSocket connection
wscat -c ws://localhost:8000/ws/kali-terminal/test_session
```

### Step 3: Configure SSH Key Path (Optional)
```python
# In kali_terminal_server.py, update key path
connect_params['key_filename'] = '/path/to/your/safeedge_kali'
```

## 🧪 Testing the Integration

### Step 1: Start Services
```bash
# Terminal 1: Start SafeEdge backend
cd src/backend
python3 main.py

# Terminal 2: Start SafeEdge frontend
npm run dev
```

### Step 2: Access Security Center
1. Open browser: `http://localhost:9002`
2. Login with admin credentials
3. Navigate to Security Center
4. Scroll down to "Kali Linux Terminal" section

### Step 3: Test Terminal Connection
1. Click "Connect" button in terminal
2. Wait for SSH connection to establish
3. You should see Kali Linux prompt: `safeedge@kali:~$`

### Step 4: Test Security Tools
```bash
# Test basic commands
whoami
uname -a
ip addr show

# Test security tools
nmap --version
nikto -Version
sqlmap --version
msfconsole -v

# Test network scan (replace with your network)
nmap -sn 192.168.1.0/24

# Test web vulnerability scan (use authorized target only)
nikto -h http://testphp.vulnweb.com/
```

## 🔒 Security Considerations

### Access Control
```bash
# Restrict SSH access to specific IPs
sudo nano /etc/ssh/sshd_config

# Add these lines:
AllowUsers safeedge
PermitRootLogin no
PasswordAuthentication no  # Use only if key-based auth is set up
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Restart SSH service
sudo systemctl restart ssh
```

### Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.1.0/24 to any port 22  # Adjust to your network
sudo ufw enable
```

### Audit Logging
```bash
# Enable comprehensive logging
sudo nano /etc/rsyslog.conf

# Add logging for security tools
local0.*    /var/log/security-tools.log

# Restart rsyslog
sudo systemctl restart rsyslog
```

## 🚨 Troubleshooting

### Connection Issues
```bash
# Check SSH service status
sudo systemctl status ssh

# Check firewall rules
sudo ufw status

# Test SSH connection manually
ssh -v safeedge@<kali-vm-ip>

# Check network connectivity
ping <kali-vm-ip>
```

### Permission Issues
```bash
# Fix SSH key permissions
chmod 600 ~/.ssh/safeedge_kali
chmod 644 ~/.ssh/safeedge_kali.pub

# Fix Kali VM SSH directory permissions
sudo chmod 700 /home/safeedge/.ssh
sudo chmod 600 /home/safeedge/.ssh/authorized_keys
sudo chown -R safeedge:safeedge /home/safeedge/.ssh
```

### Tool Installation Issues
```bash
# Update package lists
sudo apt update

# Fix broken packages
sudo apt --fix-broken install

# Reinstall specific tools
sudo apt reinstall nmap nikto sqlmap
```

## 📊 VM Resource Recommendations

### Minimum Requirements
- **RAM**: 4GB
- **CPU**: 2 cores
- **Storage**: 50GB
- **Network**: 100 Mbps

### Recommended Configuration
- **RAM**: 8GB
- **CPU**: 4 cores
- **Storage**: 100GB SSD
- **Network**: 1 Gbps

### Performance Optimization
```bash
# Disable unnecessary services
sudo systemctl disable bluetooth
sudo systemctl disable cups
sudo systemctl disable avahi-daemon

# Optimize for headless operation
sudo systemctl set-default multi-user.target
```

## 🔄 Maintenance

### Regular Updates
```bash
# Weekly update script
#!/bin/bash
sudo apt update
sudo apt upgrade -y
sudo searchsploit -u
msfupdate
```

### Backup Configuration
```bash
# Backup important configurations
tar -czf kali-backup-$(date +%Y%m%d).tar.gz \
    /home/safeedge/.ssh \
    /etc/ssh/sshd_config \
    /etc/ufw \
    ~/.msf4
```

## 🎯 Next Steps

1. **Set up your Kali VM** using one of the methods above
2. **Configure SSH access** with proper security
3. **Update SafeEdge backend** with your Kali VM IP
4. **Test the integration** through the Security Center
5. **Start security testing** with professional tools

## ⚠️ Legal and Ethical Notice

- **Only test systems you own** or have explicit written permission to test
- **Follow responsible disclosure** for any vulnerabilities found
- **Comply with local laws** and regulations regarding security testing
- **Maintain audit logs** of all testing activities
- **Use tools ethically** and professionally

The SafeEdge Kali integration is designed for legitimate security testing and research purposes only. Users are responsible for ensuring their activities comply with applicable laws and ethical guidelines.