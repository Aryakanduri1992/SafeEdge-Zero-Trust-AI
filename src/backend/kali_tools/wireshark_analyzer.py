"""
Wireshark Integration for SafeEdge Security Center
Real-time network packet analysis and IoT traffic monitoring
"""

import subprocess
import json
import os
import time
from datetime import datetime
from typing import List, Dict, Optional
import asyncio
import threading

class WiresharkAnalyzer:
    def __init__(self):
        self.capture_interface = self.detect_interface()
        self.pcap_dir = "/tmp/safeedge_captures"
        self.current_capture_file = None
        self.capture_process = None
        self.is_capturing = False
        
        # Create capture directory
        os.makedirs(self.pcap_dir, exist_ok=True)
    
    def detect_interface(self) -> str:
        """Detect the best network interface for packet capture"""
        try:
            # Try to detect active network interface
            result = subprocess.run(['route', 'get', 'default'], 
                                  capture_output=True, text=True)
            if 'interface:' in result.stdout:
                interface = result.stdout.split('interface:')[1].strip().split()[0]
                return interface
            
            # Fallback interfaces
            for interface in ['en0', 'eth0', 'wlan0', 'Wi-Fi']:
                if self.test_interface(interface):
                    return interface
            
            return 'en0'  # Default for macOS
        except:
            return 'en0'
    
    def test_interface(self, interface: str) -> bool:
        """Test if interface is available for capture"""
        try:
            result = subprocess.run(['ifconfig', interface], 
                                  capture_output=True, text=True)
            return result.returncode == 0
        except:
            return False
    
    def start_packet_capture(self, duration: int = 60, filter_expr: str = "") -> Dict:
        """Start Wireshark packet capture"""
        try:
            if self.is_capturing:
                return {"success": False, "error": "Capture already in progress"}
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            self.current_capture_file = f"{self.pcap_dir}/safeedge_capture_{timestamp}.pcap"
            
            # Build tshark command
            cmd = [
                'tshark',
                '-i', self.capture_interface,
                '-a', f'duration:{duration}',
                '-w', self.current_capture_file
            ]
            
            if filter_expr:
                cmd.extend(['-f', filter_expr])
            
            # Start capture process
            self.capture_process = subprocess.Popen(
                cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE
            )
            
            self.is_capturing = True
            
            # Start monitoring thread
            threading.Thread(
                target=self._monitor_capture, 
                args=(duration,), 
                daemon=True
            ).start()
            
            return {
                "success": True,
                "capture_file": self.current_capture_file,
                "interface": self.capture_interface,
                "duration": duration,
                "filter": filter_expr or "none"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _monitor_capture(self, duration: int):
        """Monitor capture process"""
        try:
            self.capture_process.wait(timeout=duration + 10)
        except subprocess.TimeoutExpired:
            self.capture_process.kill()
        finally:
            self.is_capturing = False
    
    def stop_capture(self) -> Dict:
        """Stop current packet capture"""
        try:
            if not self.is_capturing or not self.capture_process:
                return {"success": False, "error": "No active capture"}
            
            self.capture_process.terminate()
            self.capture_process.wait(timeout=5)
            self.is_capturing = False
            
            return {
                "success": True,
                "capture_file": self.current_capture_file,
                "message": "Capture stopped successfully"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def analyze_iot_traffic(self, pcap_file: str = None) -> Dict:
        """Analyze IoT device traffic patterns"""
        try:
            if not pcap_file:
                pcap_file = self.current_capture_file
            
            if not pcap_file or not os.path.exists(pcap_file):
                return {"success": False, "error": "No capture file available"}
            
            # Analyze different aspects of IoT traffic
            results = {
                "success": True,
                "file": pcap_file,
                "analysis": {
                    "total_packets": self._count_packets(pcap_file),
                    "protocols": self._analyze_protocols(pcap_file),
                    "top_talkers": self._get_top_talkers(pcap_file),
                    "iot_devices": self._identify_iot_devices(pcap_file),
                    "anomalies": self._detect_traffic_anomalies(pcap_file),
                    "security_issues": self._detect_security_issues(pcap_file)
                }
            }
            
            return results
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _count_packets(self, pcap_file: str) -> int:
        """Count total packets in capture"""
        try:
            cmd = ['tshark', '-r', pcap_file, '-T', 'fields', '-e', 'frame.number']
            result = subprocess.run(cmd, capture_output=True, text=True)
            return len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0
        except:
            return 0
    
    def _analyze_protocols(self, pcap_file: str) -> Dict:
        """Analyze protocol distribution"""
        try:
            cmd = ['tshark', '-r', pcap_file, '-q', '-z', 'io,phs']
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            protocols = {}
            lines = result.stdout.split('\n')
            
            for line in lines:
                if 'frames:' in line and 'bytes:' in line:
                    parts = line.strip().split()
                    if len(parts) >= 3:
                        protocol = parts[0]
                        frames = int(parts[1].replace('frames:', ''))
                        protocols[protocol] = frames
            
            return protocols
        except:
            return {}
    
    def _get_top_talkers(self, pcap_file: str) -> List[Dict]:
        """Get top talking IP addresses"""
        try:
            cmd = ['tshark', '-r', pcap_file, '-q', '-z', 'endpoints,ip']
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            talkers = []
            lines = result.stdout.split('\n')
            
            for line in lines:
                if '.' in line and 'Packets' not in line and line.strip():
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        try:
                            ip = parts[0]
                            packets = int(parts[1])
                            bytes_count = int(parts[2])
                            
                            talkers.append({
                                "ip": ip,
                                "packets": packets,
                                "bytes": bytes_count
                            })
                        except:
                            continue
            
            # Sort by packet count and return top 10
            return sorted(talkers, key=lambda x: x['packets'], reverse=True)[:10]
        except:
            return []
    
    def _identify_iot_devices(self, pcap_file: str) -> List[Dict]:
        """Identify potential IoT devices based on traffic patterns"""
        try:
            # Look for common IoT protocols and patterns
            iot_indicators = [
                'mqtt',
                'coap',
                'lwm2m',
                'http and tcp.port == 8080',
                'http and tcp.port == 80'
            ]
            
            iot_devices = []
            
            for indicator in iot_indicators:
                cmd = ['tshark', '-r', pcap_file, '-Y', indicator, '-T', 'fields', '-e', 'ip.src', '-e', 'ip.dst']
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.stdout.strip():
                    lines = result.stdout.strip().split('\n')
                    for line in lines:
                        if '\t' in line:
                            src, dst = line.split('\t')
                            
                            # Check if it's a local IoT device (private IP)
                            if self._is_private_ip(src):
                                iot_devices.append({
                                    "ip": src,
                                    "protocol": indicator,
                                    "type": "potential_iot_device"
                                })
            
            # Remove duplicates
            unique_devices = []
            seen_ips = set()
            for device in iot_devices:
                if device['ip'] not in seen_ips:
                    unique_devices.append(device)
                    seen_ips.add(device['ip'])
            
            return unique_devices
        except:
            return []
    
    def _detect_traffic_anomalies(self, pcap_file: str) -> List[Dict]:
        """Detect traffic anomalies"""
        try:
            anomalies = []
            
            # Check for unusual packet sizes
            cmd = ['tshark', '-r', pcap_file, '-T', 'fields', '-e', 'frame.len', '-e', 'ip.src']
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.stdout.strip():
                lines = result.stdout.strip().split('\n')
                large_packets = []
                
                for line in lines:
                    if '\t' in line:
                        try:
                            size, src_ip = line.split('\t')
                            size = int(size)
                            
                            # Flag unusually large packets (>1400 bytes)
                            if size > 1400:
                                large_packets.append({
                                    "type": "large_packet",
                                    "size": size,
                                    "source_ip": src_ip,
                                    "severity": "medium"
                                })
                        except:
                            continue
                
                if large_packets:
                    anomalies.extend(large_packets[:5])  # Top 5 large packets
            
            # Check for high frequency communications
            top_talkers = self._get_top_talkers(pcap_file)
            for talker in top_talkers[:3]:
                if talker['packets'] > 100:  # Threshold for high activity
                    anomalies.append({
                        "type": "high_frequency_communication",
                        "source_ip": talker['ip'],
                        "packet_count": talker['packets'],
                        "severity": "low"
                    })
            
            return anomalies
        except:
            return []
    
    def _detect_security_issues(self, pcap_file: str) -> List[Dict]:
        """Detect potential security issues"""
        try:
            security_issues = []
            
            # Check for unencrypted HTTP traffic
            cmd = ['tshark', '-r', pcap_file, '-Y', 'http', '-T', 'fields', '-e', 'ip.src', '-e', 'http.host']
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.stdout.strip():
                lines = result.stdout.strip().split('\n')
                for line in lines[:5]:  # Limit to first 5
                    if '\t' in line:
                        src_ip, host = line.split('\t')
                        security_issues.append({
                            "type": "unencrypted_http",
                            "source_ip": src_ip,
                            "host": host,
                            "severity": "medium",
                            "description": "Unencrypted HTTP communication detected"
                        })
            
            # Check for DNS queries to suspicious domains
            cmd = ['tshark', '-r', pcap_file, '-Y', 'dns', '-T', 'fields', '-e', 'dns.qry.name']
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.stdout.strip():
                suspicious_domains = ['malware.com', 'phishing.net', 'botnet.org']  # Example
                lines = result.stdout.strip().split('\n')
                
                for line in lines:
                    domain = line.strip()
                    if any(suspicious in domain for suspicious in suspicious_domains):
                        security_issues.append({
                            "type": "suspicious_dns_query",
                            "domain": domain,
                            "severity": "high",
                            "description": f"DNS query to suspicious domain: {domain}"
                        })
            
            return security_issues
        except:
            return []
    
    def _is_private_ip(self, ip: str) -> bool:
        """Check if IP is in private range"""
        try:
            parts = ip.split('.')
            if len(parts) != 4:
                return False
            
            first = int(parts[0])
            second = int(parts[1])
            
            # Private IP ranges
            if first == 10:
                return True
            elif first == 172 and 16 <= second <= 31:
                return True
            elif first == 192 and second == 168:
                return True
            
            return False
        except:
            return False
    
    def get_capture_status(self) -> Dict:
        """Get current capture status"""
        return {
            "is_capturing": self.is_capturing,
            "interface": self.capture_interface,
            "current_file": self.current_capture_file,
            "capture_directory": self.pcap_dir
        }
    
    def list_capture_files(self) -> List[Dict]:
        """List available capture files"""
        try:
            files = []
            for filename in os.listdir(self.pcap_dir):
                if filename.endswith('.pcap'):
                    filepath = os.path.join(self.pcap_dir, filename)
                    stat = os.stat(filepath)
                    
                    files.append({
                        "filename": filename,
                        "filepath": filepath,
                        "size": stat.st_size,
                        "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                    })
            
            return sorted(files, key=lambda x: x['created'], reverse=True)
        except:
            return []
    
    def export_analysis_report(self, pcap_file: str = None) -> Dict:
        """Export comprehensive analysis report"""
        try:
            analysis = self.analyze_iot_traffic(pcap_file)
            
            if not analysis['success']:
                return analysis
            
            # Create comprehensive report
            report = {
                "report_id": f"wireshark_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "generated_at": datetime.now().isoformat(),
                "capture_file": analysis['file'],
                "summary": {
                    "total_packets": analysis['analysis']['total_packets'],
                    "protocols_detected": len(analysis['analysis']['protocols']),
                    "iot_devices_found": len(analysis['analysis']['iot_devices']),
                    "anomalies_detected": len(analysis['analysis']['anomalies']),
                    "security_issues": len(analysis['analysis']['security_issues'])
                },
                "detailed_analysis": analysis['analysis'],
                "recommendations": self._generate_recommendations(analysis['analysis'])
            }
            
            return {"success": True, "report": report}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _generate_recommendations(self, analysis: Dict) -> List[str]:
        """Generate security recommendations based on analysis"""
        recommendations = []
        
        if analysis['security_issues']:
            recommendations.append("🔒 Enable HTTPS for all web communications")
            recommendations.append("🛡️ Implement network segmentation for IoT devices")
        
        if analysis['anomalies']:
            recommendations.append("📊 Monitor traffic patterns for unusual activity")
            recommendations.append("⚠️ Investigate devices with high packet volumes")
        
        if analysis['iot_devices']:
            recommendations.append("🔐 Ensure all IoT devices use encrypted protocols")
            recommendations.append("🔄 Regularly update IoT device firmware")
        
        if not recommendations:
            recommendations.append("✅ Network traffic appears normal - continue monitoring")
        
        return recommendations