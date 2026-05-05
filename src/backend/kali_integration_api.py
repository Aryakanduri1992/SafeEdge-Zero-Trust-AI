"""
Kali Linux Security Tools API Integration for SafeEdge
FastAPI routes for integrating Wireshark, Nmap, Suricata, and other security tools
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
import os

from kali_tools.wireshark_analyzer import WiresharkAnalyzer

# Initialize router
router = APIRouter(prefix="/api/security-tools", tags=["Kali Security Tools"])

# Initialize analyzers
wireshark = WiresharkAnalyzer()

# Pydantic models
class PacketCaptureRequest(BaseModel):
    duration: int = 60
    filter_expression: Optional[str] = ""
    interface: Optional[str] = None

class PacketCaptureResponse(BaseModel):
    success: bool
    capture_file: Optional[str] = None
    interface: Optional[str] = None
    duration: Optional[int] = None
    filter: Optional[str] = None
    error: Optional[str] = None

class TrafficAnalysisResponse(BaseModel):
    success: bool
    analysis: Optional[Dict] = None
    error: Optional[str] = None

# ==================== WIRESHARK INTEGRATION ====================

@router.post("/wireshark/start-capture", response_model=PacketCaptureResponse)
async def start_wireshark_capture(request: PacketCaptureRequest):
    """
    Start Wireshark packet capture
    
    - **duration**: Capture duration in seconds (default: 60)
    - **filter_expression**: Optional packet filter (e.g., "tcp port 80")
    - **interface**: Network interface to capture on (auto-detected if not specified)
    """
    try:
        # Set interface if specified
        if request.interface:
            wireshark.capture_interface = request.interface
        
        result = wireshark.start_packet_capture(
            duration=request.duration,
            filter_expr=request.filter_expression or ""
        )
        
        return PacketCaptureResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start capture: {str(e)}")

@router.post("/wireshark/stop-capture")
async def stop_wireshark_capture():
    """Stop current Wireshark packet capture"""
    try:
        result = wireshark.stop_capture()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop capture: {str(e)}")

@router.get("/wireshark/status")
async def get_wireshark_status():
    """Get current Wireshark capture status"""
    try:
        return wireshark.get_capture_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

@router.get("/wireshark/analyze/{capture_file}")
async def analyze_traffic(capture_file: str):
    """
    Analyze captured network traffic
    
    - **capture_file**: Name of the capture file to analyze
    """
    try:
        # Construct full path
        pcap_path = os.path.join(wireshark.pcap_dir, capture_file)
        
        if not os.path.exists(pcap_path):
            raise HTTPException(status_code=404, detail="Capture file not found")
        
        result = wireshark.analyze_iot_traffic(pcap_path)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/wireshark/analyze-latest")
async def analyze_latest_capture():
    """Analyze the most recent packet capture"""
    try:
        result = wireshark.analyze_iot_traffic()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/wireshark/captures")
async def list_capture_files():
    """List all available packet capture files"""
    try:
        return {
            "success": True,
            "captures": wireshark.list_capture_files()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list captures: {str(e)}")

@router.get("/wireshark/report/{capture_file}")
async def generate_analysis_report(capture_file: str):
    """
    Generate comprehensive analysis report for a capture file
    
    - **capture_file**: Name of the capture file to analyze
    """
    try:
        pcap_path = os.path.join(wireshark.pcap_dir, capture_file)
        
        if not os.path.exists(pcap_path):
            raise HTTPException(status_code=404, detail="Capture file not found")
        
        result = wireshark.export_analysis_report(pcap_path)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

# ==================== NETWORK SCANNING (Future Implementation) ====================

@router.post("/nmap/discover-network")
async def discover_network(network: str = "192.168.1.0/24"):
    """
    Discover devices on network using Nmap
    
    - **network**: Network range to scan (default: 192.168.1.0/24)
    """
    # TODO: Implement Nmap integration
    return {
        "success": False,
        "error": "Nmap integration not yet implemented",
        "message": "Coming soon in next update"
    }

@router.post("/nmap/port-scan/{target_ip}")
async def port_scan(target_ip: str):
    """
    Perform port scan on target IP
    
    - **target_ip**: IP address to scan
    """
    # TODO: Implement Nmap port scanning
    return {
        "success": False,
        "error": "Nmap port scanning not yet implemented",
        "message": "Coming soon in next update"
    }

# ==================== INTRUSION DETECTION (Future Implementation) ====================

@router.get("/suricata/alerts")
async def get_suricata_alerts():
    """Get Suricata IDS alerts"""
    # TODO: Implement Suricata integration
    return {
        "success": False,
        "error": "Suricata integration not yet implemented",
        "message": "Coming soon in next update"
    }

@router.post("/suricata/start-monitoring")
async def start_suricata_monitoring(interface: str = "eth0"):
    """
    Start Suricata IDS monitoring
    
    - **interface**: Network interface to monitor
    """
    # TODO: Implement Suricata monitoring
    return {
        "success": False,
        "error": "Suricata monitoring not yet implemented",
        "message": "Coming soon in next update"
    }

# ==================== VULNERABILITY SCANNING (Future Implementation) ====================

@router.post("/openvas/scan")
async def start_openvas_scan(targets: List[str]):
    """
    Start OpenVAS vulnerability scan
    
    - **targets**: List of IP addresses to scan
    """
    # TODO: Implement OpenVAS integration
    return {
        "success": False,
        "error": "OpenVAS integration not yet implemented",
        "message": "Coming soon in next update"
    }

@router.get("/nikto/scan/{target_url}")
async def nikto_web_scan(target_url: str):
    """
    Perform Nikto web vulnerability scan
    
    - **target_url**: URL to scan for web vulnerabilities
    """
    # TODO: Implement Nikto integration
    return {
        "success": False,
        "error": "Nikto integration not yet implemented",
        "message": "Coming soon in next update"
    }

# ==================== SYSTEM INFORMATION ====================

@router.get("/system/tools-status")
async def get_tools_status():
    """Get status of all security tools"""
    try:
        tools_status = {
            "wireshark": {
                "available": True,
                "status": "operational",
                "interface": wireshark.capture_interface,
                "capturing": wireshark.is_capturing
            },
            "nmap": {
                "available": False,
                "status": "not_implemented",
                "message": "Coming soon"
            },
            "suricata": {
                "available": False,
                "status": "not_implemented", 
                "message": "Coming soon"
            },
            "openvas": {
                "available": False,
                "status": "not_implemented",
                "message": "Coming soon"
            },
            "nikto": {
                "available": False,
                "status": "not_implemented",
                "message": "Coming soon"
            }
        }
        
        return {
            "success": True,
            "tools": tools_status,
            "summary": {
                "total_tools": len(tools_status),
                "available_tools": sum(1 for tool in tools_status.values() if tool["available"]),
                "operational_tools": sum(1 for tool in tools_status.values() if tool["status"] == "operational")
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tools status: {str(e)}")

@router.get("/system/network-interfaces")
async def get_network_interfaces():
    """Get available network interfaces for packet capture"""
    try:
        import subprocess
        
        # Get network interfaces
        result = subprocess.run(['ifconfig'], capture_output=True, text=True)
        
        interfaces = []
        current_interface = None
        
        for line in result.stdout.split('\n'):
            if line and not line.startswith('\t') and not line.startswith(' '):
                # New interface
                interface_name = line.split(':')[0]
                current_interface = {
                    "name": interface_name,
                    "status": "unknown",
                    "ip": None
                }
                interfaces.append(current_interface)
            elif current_interface and 'inet ' in line:
                # IP address line
                parts = line.strip().split()
                for i, part in enumerate(parts):
                    if part == 'inet' and i + 1 < len(parts):
                        current_interface["ip"] = parts[i + 1]
                        current_interface["status"] = "active"
                        break
        
        return {
            "success": True,
            "interfaces": interfaces,
            "current_interface": wireshark.capture_interface
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "interfaces": [],
            "current_interface": wireshark.capture_interface
        }