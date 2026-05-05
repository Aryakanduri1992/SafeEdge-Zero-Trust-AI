"""
Kali Linux Terminal WebSocket Server
Provides secure SSH bridge between web terminal and Kali VM
"""

import asyncio
import websockets
import paramiko
import json
import logging
import threading
import time
from typing import Dict, Optional
from datetime import datetime
import os
import select

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KaliTerminalSession:
    def __init__(self, session_id: str, kali_host: str, kali_port: int = 22):
        self.session_id = session_id
        self.kali_host = kali_host
        self.kali_port = kali_port
        self.ssh_client: Optional[paramiko.SSHClient] = None
        self.shell_channel: Optional[paramiko.Channel] = None
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        self.is_connected = False
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        
    async def connect_to_kali(self, username: str = 'safeedge', key_path: str = None, password: str = None):
        """Establish SSH connection to Kali VM"""
        try:
            self.ssh_client = paramiko.SSHClient()
            self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Connection parameters
            connect_params = {
                'hostname': self.kali_host,
                'port': self.kali_port,
                'username': username,
                'timeout': 10,
                'allow_agent': False,
                'look_for_keys': False
            }
            
            # Use SSH key if provided, otherwise try password
            if key_path and os.path.exists(key_path):
                connect_params['key_filename'] = key_path
            elif password:
                connect_params['password'] = password
            else:
                # For demo purposes - in production, use proper key management
                connect_params['password'] = 'kali'  # Default Kali password
            
            logger.info(f"Connecting to Kali VM at {self.kali_host}:{self.kali_port} with username {username}")
            self.ssh_client.connect(**connect_params)
            
            # Create interactive shell
            self.shell_channel = self.ssh_client.invoke_shell(
                term='xterm-256color',
                width=80,
                height=24
            )
            
            # Set shell to non-blocking
            self.shell_channel.settimeout(0.1)
            
            self.is_connected = True
            logger.info(f"SSH connection established for session {self.session_id}")
            
            # Send initial Kali prompt
            await self.send_to_websocket(f"\r\n\x1b[32m[SUCCESS]\x1b[0m Connected to Kali Linux VM\r\n")
            await self.send_to_websocket(f"\x1b[32m[INFO]\x1b[0m SSH session established to {self.kali_host}\r\n")
            await self.send_to_websocket(f"\x1b[36m[READY]\x1b[0m Kali Linux security tools are now available\r\n\r\n")
            
            return True
            
        except paramiko.AuthenticationException as e:
            logger.error(f"Authentication failed for session {self.session_id}: {e}")
            await self.send_to_websocket(f"\r\n\x1b[31m[ERROR]\x1b[0m Authentication failed\r\n")
            await self.send_to_websocket(f"\x1b[31m[ERROR]\x1b[0m Check SSH credentials for Kali VM\r\n")
            return False
            
        except paramiko.SSHException as e:
            logger.error(f"SSH connection failed for session {self.session_id}: {e}")
            await self.send_to_websocket(f"\r\n\x1b[31m[ERROR]\x1b[0m SSH connection failed: {str(e)}\r\n")
            return False
            
        except Exception as e:
            logger.error(f"Connection error for session {self.session_id}: {e}")
            await self.send_to_websocket(f"\r\n\x1b[31m[ERROR]\x1b[0m Connection failed: {str(e)}\r\n")
            await self.send_to_websocket(f"\x1b[31m[DEBUG]\x1b[0m Host: {self.kali_host}, Port: {self.kali_port}, User: {username}\r\n")
            return False
    
    async def send_to_websocket(self, data: str):
        """Send data to WebSocket client"""
        if self.websocket:
            try:
                await self.websocket.send_text(data)
            except Exception as e:
                logger.warning(f"WebSocket send error for session {self.session_id}: {e}")
                self.websocket = None
    
    async def send_to_kali(self, data: str):
        """Send data to Kali VM shell"""
        if self.shell_channel and self.is_connected:
            try:
                self.shell_channel.send(data)
                self.last_activity = datetime.now()
                
                # Log command for security audit
                if data.strip() and data != '\r' and data != '\n':
                    logger.info(f"Command executed in session {self.session_id}: {data.strip()}")
                    
            except Exception as e:
                logger.error(f"Error sending to Kali VM: {e}")
                await self.send_to_websocket(f"\r\n\x1b[31m[ERROR]\x1b[0m Connection to Kali VM lost\r\n")
                self.is_connected = False
    
    async def read_from_kali(self):
        """Read output from Kali VM shell"""
        while self.is_connected and self.shell_channel:
            try:
                if self.shell_channel.recv_ready():
                    data = self.shell_channel.recv(1024).decode('utf-8', errors='ignore')
                    if data:
                        await self.send_to_websocket(data)
                        self.last_activity = datetime.now()
                else:
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                logger.error(f"Error reading from Kali VM: {e}")
                self.is_connected = False
                break
    
    def disconnect(self):
        """Clean up SSH connection"""
        self.is_connected = False
        
        if self.shell_channel:
            self.shell_channel.close()
            self.shell_channel = None
            
        if self.ssh_client:
            self.ssh_client.close()
            self.ssh_client = None
            
        logger.info(f"Session {self.session_id} disconnected")

class KaliTerminalServer:
    def __init__(self, kali_host: str = 'localhost', kali_port: int = 22):
        self.kali_host = kali_host
        self.kali_port = kali_port
        self.sessions: Dict[str, KaliTerminalSession] = {}
        self.cleanup_task = None
        
    async def handle_websocket_connection(self, websocket, path):
        """Handle new WebSocket connection"""
        try:
            # Extract session ID from path
            session_id = path.split('/')[-1]
            logger.info(f"New WebSocket connection for session {session_id}")
            
            # Create or get existing session
            if session_id not in self.sessions:
                self.sessions[session_id] = KaliTerminalSession(
                    session_id, self.kali_host, self.kali_port
                )
            
            session = self.sessions[session_id]
            session.websocket = websocket
            
            # Send welcome message
            await session.send_to_websocket(
                f"\x1b[33m[CONNECTING]\x1b[0m Establishing SSH connection to Kali VM...\r\n"
            )
            
            # Connect to Kali VM
            if await session.connect_to_kali():
                # Start reading from Kali VM
                read_task = asyncio.create_task(session.read_from_kali())
                
                try:
                    # Handle WebSocket messages
                    async for message in websocket:
                        if isinstance(message, str):
                            await session.send_to_kali(message)
                        elif isinstance(message, bytes):
                            await session.send_to_kali(message.decode('utf-8', errors='ignore'))
                            
                except websockets.exceptions.ConnectionClosed:
                    logger.info(f"WebSocket connection closed for session {session_id}")
                finally:
                    read_task.cancel()
            else:
                await session.send_to_websocket(
                    f"\x1b[31m[FAILED]\x1b[0m Unable to connect to Kali VM\r\n"
                )
                
        except Exception as e:
            logger.error(f"WebSocket handler error: {e}")
        finally:
            # Clean up session
            if session_id in self.sessions:
                self.sessions[session_id].disconnect()
                del self.sessions[session_id]
    
    async def cleanup_inactive_sessions(self):
        """Clean up inactive sessions periodically"""
        while True:
            try:
                current_time = datetime.now()
                inactive_sessions = []
                
                for session_id, session in self.sessions.items():
                    # Remove sessions inactive for more than 30 minutes
                    if (current_time - session.last_activity).seconds > 1800:
                        inactive_sessions.append(session_id)
                
                for session_id in inactive_sessions:
                    logger.info(f"Cleaning up inactive session {session_id}")
                    self.sessions[session_id].disconnect()
                    del self.sessions[session_id]
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"Cleanup task error: {e}")
                await asyncio.sleep(60)
    
    async def start_server(self, host: str = 'localhost', port: int = 8765):
        """Start the WebSocket server"""
        logger.info(f"Starting Kali Terminal WebSocket server on {host}:{port}")
        
        # Start cleanup task
        self.cleanup_task = asyncio.create_task(self.cleanup_inactive_sessions())
        
        # Start WebSocket server
        server = await websockets.serve(
            self.handle_websocket_connection,
            host,
            port,
            ping_interval=30,
            ping_timeout=10
        )
        
        logger.info(f"Kali Terminal server started successfully")
        return server
    
    def get_session_info(self) -> Dict:
        """Get information about active sessions"""
        return {
            'active_sessions': len(self.sessions),
            'kali_host': self.kali_host,
            'kali_port': self.kali_port,
            'sessions': {
                session_id: {
                    'connected': session.is_connected,
                    'created_at': session.created_at.isoformat(),
                    'last_activity': session.last_activity.isoformat()
                }
                for session_id, session in self.sessions.items()
            }
        }

# FastAPI integration
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

# Global server instance
kali_server = None

def init_kali_terminal_server(app: FastAPI, kali_host: str = 'localhost'):
    """Initialize Kali terminal server with FastAPI"""
    global kali_server
    
    kali_server = KaliTerminalServer(kali_host)
    
    @app.websocket("/ws/kali-terminal/{session_id}")
    async def websocket_endpoint(websocket: WebSocket, session_id: str):
        await websocket.accept()
        
        # Get connection parameters from query string
        query_params = dict(websocket.query_params)
        kali_host = query_params.get('host', 'localhost')
        kali_port = int(query_params.get('port', '22'))
        kali_username = query_params.get('username', 'safeedge')
        kali_password = query_params.get('password', 'kali')
        
        try:
            # Create session with dynamic parameters
            if session_id not in kali_server.sessions:
                kali_server.sessions[session_id] = KaliTerminalSession(
                    session_id, kali_host, kali_port
                )
            
            session = kali_server.sessions[session_id]
            session.websocket = websocket
            
            # Send connection message
            await websocket.send_text(
                f"\x1b[33m[CONNECTING]\x1b[0m Establishing SSH connection to Kali VM...\r\n"
            )
            await websocket.send_text(
                f"\x1b[33m[INFO]\x1b[0m Target: {kali_host}:{kali_port}\r\n"
            )
            await websocket.send_text(
                f"\x1b[33m[INFO]\x1b[0m Username: {kali_username}\r\n"
            )
            
            # Connect to Kali VM with provided credentials
            if await session.connect_to_kali(username=kali_username, password=kali_password):
                # Start reading from Kali VM
                read_task = asyncio.create_task(session.read_from_kali())
                
                try:
                    while True:
                        data = await websocket.receive_text()
                        await session.send_to_kali(data)
                        
                except WebSocketDisconnect:
                    logger.info(f"WebSocket disconnected for session {session_id}")
                finally:
                    read_task.cancel()
            else:
                await websocket.send_text(
                    f"\x1b[31m[FAILED]\x1b[0m Unable to connect to Kali VM at {kali_host}:{kali_port}\r\n"
                )
                await websocket.send_text(
                    f"\x1b[31m[ERROR]\x1b[0m Check IP address, credentials, and network connectivity\r\n"
                )
                
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            await websocket.send_text(f"\x1b[31m[ERROR]\x1b[0m Connection failed: {str(e)}\r\n")
        finally:
            # Clean up
            if session_id in kali_server.sessions:
                kali_server.sessions[session_id].disconnect()
                del kali_server.sessions[session_id]
    
    @app.get("/api/kali-terminal/status")
    async def get_terminal_status():
        """Get Kali terminal server status"""
        if kali_server:
            return JSONResponse(content={
                "success": True,
                "status": kali_server.get_session_info()
            })
        else:
            return JSONResponse(content={
                "success": False,
                "error": "Kali terminal server not initialized"
            })
    
    @app.post("/api/kali-terminal/disconnect/{session_id}")
    async def disconnect_session(session_id: str):
        """Disconnect a specific session"""
        if kali_server and session_id in kali_server.sessions:
            kali_server.sessions[session_id].disconnect()
            del kali_server.sessions[session_id]
            return JSONResponse(content={
                "success": True,
                "message": f"Session {session_id} disconnected"
            })
        else:
            return JSONResponse(content={
                "success": False,
                "error": "Session not found"
            })

if __name__ == "__main__":
    # Standalone server for testing
    async def main():
        server = KaliTerminalServer('192.168.1.100')  # Replace with your Kali VM IP
        websocket_server = await server.start_server('localhost', 8765)
        
        print("Kali Terminal WebSocket server running on ws://localhost:8765")
        print("Connect with path: /ws/kali-terminal/{session_id}")
        
        await websocket_server.wait_closed()
    
    asyncio.run(main())