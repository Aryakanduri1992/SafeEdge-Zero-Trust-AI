"""
SafeEdge WebSocket Server
=========================
Real-time WebSocket server for ESP32 device updates.
Provides device-specific and organization-wide channels.

Author: SafeEdge Team
"""

from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from typing import Dict, Set, Optional, Any
import asyncio
import json
from datetime import datetime
import jwt
from firebase_esp32_service import get_firebase_esp32_service, FirebaseESP32Service
import firebase_admin
from firebase_admin import db


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Device-specific connections: {device_id: Set[WebSocket]}
        self.device_connections: Dict[str, Set[WebSocket]] = {}
        
        # Organization-wide connections: {organization_id: Set[WebSocket]}
        self.organization_connections: Dict[str, Set[WebSocket]] = {}
        
        # Connection metadata: {WebSocket: {device_id, organization_id, user_id}}
        self.connection_metadata: Dict[WebSocket, Dict[str, str]] = {}
        
        # Firebase listeners
        self.firebase_listeners: Dict[str, Any] = {}
    
    async def connect(
        self, 
        websocket: WebSocket, 
        device_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        user_id: Optional[str] = None
    ):
        """Accept WebSocket connection and register it"""
        await websocket.accept()
        
        # Store connection metadata
        self.connection_metadata[websocket] = {
            'device_id': device_id,
            'organization_id': organization_id,
            'user_id': user_id,
            'connected_at': datetime.now().isoformat()
        }
        
        # Register device-specific connection
        if device_id:
            if device_id not in self.device_connections:
                self.device_connections[device_id] = set()
            self.device_connections[device_id].add(websocket)
            print(f"✅ WebSocket connected to device: {device_id}")
        
        # Register organization-wide connection
        if organization_id:
            if organization_id not in self.organization_connections:
                self.organization_connections[organization_id] = set()
            self.organization_connections[organization_id].add(websocket)
            print(f"✅ WebSocket connected to organization: {organization_id}")
        
        # Send welcome message
        await self.send_personal_message({
            'type': 'connection_established',
            'message': 'Connected to SafeEdge real-time updates',
            'timestamp': datetime.now().isoformat(),
            'device_id': device_id,
            'organization_id': organization_id
        }, websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        metadata = self.connection_metadata.get(websocket, {})
        device_id = metadata.get('device_id')
        organization_id = metadata.get('organization_id')
        
        # Remove from device connections
        if device_id and device_id in self.device_connections:
            self.device_connections[device_id].discard(websocket)
            if not self.device_connections[device_id]:
                del self.device_connections[device_id]
            print(f"❌ WebSocket disconnected from device: {device_id}")
        
        # Remove from organization connections
        if organization_id and organization_id in self.organization_connections:
            self.organization_connections[organization_id].discard(websocket)
            if not self.organization_connections[organization_id]:
                del self.organization_connections[organization_id]
            print(f"❌ WebSocket disconnected from organization: {organization_id}")
        
        # Remove metadata
        if websocket in self.connection_metadata:
            del self.connection_metadata[websocket]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific WebSocket connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending message: {e}")
    
    async def broadcast_to_device(self, device_id: str, message: dict):
        """Broadcast message to all connections watching a device"""
        if device_id in self.device_connections:
            disconnected = set()
            for connection in self.device_connections[device_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to device {device_id}: {e}")
                    disconnected.add(connection)
            
            # Clean up disconnected connections
            for connection in disconnected:
                self.disconnect(connection)
    
    async def broadcast_to_organization(self, organization_id: str, message: dict):
        """Broadcast message to all connections in an organization"""
        if organization_id in self.organization_connections:
            disconnected = set()
            for connection in self.organization_connections[organization_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to organization {organization_id}: {e}")
                    disconnected.add(connection)
            
            # Clean up disconnected connections
            for connection in disconnected:
                self.disconnect(connection)
    
    def get_connection_count(self) -> Dict[str, int]:
        """Get statistics about active connections"""
        return {
            'total_connections': len(self.connection_metadata),
            'device_channels': len(self.device_connections),
            'organization_channels': len(self.organization_connections)
        }


# Global connection manager instance
manager = ConnectionManager()


def verify_websocket_token(token: str) -> Dict[str, Any]:
    """Verify JWT token for WebSocket authentication"""
    try:
        # TODO: Replace with your actual JWT secret
        SECRET_KEY = "your-secret-key-here"  # Should come from environment variable
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


async def websocket_device_endpoint(
    websocket: WebSocket,
    device_id: str,
    token: Optional[str] = None
):
    """
    WebSocket endpoint for device-specific updates
    URL: /ws/devices/{device_id}?token=<jwt_token>
    """
    # Authenticate connection
    if token:
        try:
            payload = verify_websocket_token(token)
            user_id = payload.get('user_id')
            organization_id = payload.get('organization_id')
        except HTTPException:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    else:
        # For development, allow connections without token
        user_id = None
        organization_id = None
    
    # Connect WebSocket
    await manager.connect(
        websocket,
        device_id=device_id,
        organization_id=organization_id,
        user_id=user_id
    )
    
    try:
        # Keep connection alive with ping/pong
        while True:
            try:
                # Wait for messages from client (ping/pong)
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0  # 30 second timeout
                )
                
                # Handle ping
                if data == "ping":
                    await websocket.send_text("pong")
                
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                try:
                    await websocket.send_json({
                        'type': 'ping',
                        'timestamp': datetime.now().isoformat()
                    })
                except:
                    break
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


async def websocket_organization_endpoint(
    websocket: WebSocket,
    organization_id: str,
    token: Optional[str] = None
):
    """
    WebSocket endpoint for organization-wide updates
    URL: /ws/organizations/{organization_id}?token=<jwt_token>
    """
    # Authenticate connection
    if token:
        try:
            payload = verify_websocket_token(token)
            user_id = payload.get('user_id')
            user_org_id = payload.get('organization_id')
            
            # Verify user belongs to this organization
            if user_org_id != organization_id:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        except HTTPException:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    else:
        # For development, allow connections without token
        user_id = None
    
    # Connect WebSocket
    await manager.connect(
        websocket,
        organization_id=organization_id,
        user_id=user_id
    )
    
    try:
        # Keep connection alive with ping/pong
        while True:
            try:
                # Wait for messages from client (ping/pong)
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0  # 30 second timeout
                )
                
                # Handle ping
                if data == "ping":
                    await websocket.send_text("pong")
                
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                try:
                    await websocket.send_json({
                        'type': 'ping',
                        'timestamp': datetime.now().isoformat()
                    })
                except:
                    break
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# Firebase Event Bridge
class FirebaseEventBridge:
    """Bridge Firebase real-time events to WebSocket connections"""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.manager = connection_manager
        self.firebase_service = get_firebase_esp32_service()
        self.listeners = {}
    
    def start_listening_to_device(self, device_id: str):
        """Start listening to Firebase changes for a device"""
        if device_id in self.listeners:
            return  # Already listening
        
        # Listen to current data changes
        def on_current_data_change(event):
            """Callback for current data changes"""
            asyncio.create_task(
                self.manager.broadcast_to_device(device_id, {
                    'type': 'sensor_update',
                    'device_id': device_id,
                    'data': event.data,
                    'timestamp': datetime.now().isoformat()
                })
            )
        
        # Listen to new alerts
        def on_alert_change(event):
            """Callback for new alerts"""
            asyncio.create_task(
                self.manager.broadcast_to_device(device_id, {
                    'type': 'alert',
                    'device_id': device_id,
                    'alert': event.data,
                    'timestamp': datetime.now().isoformat()
                })
            )
        
        # Listen to device info changes (status)
        def on_info_change(event):
            """Callback for device info changes"""
            asyncio.create_task(
                self.manager.broadcast_to_device(device_id, {
                    'type': 'status_change',
                    'device_id': device_id,
                    'info': event.data,
                    'timestamp': datetime.now().isoformat()
                })
            )
        
        # Set up Firebase listeners
        try:
            db_ref = db.reference()
            
            current_ref = db_ref.child(f'devices/{device_id}/current')
            current_ref.listen(on_current_data_change)
            
            alerts_ref = db_ref.child(f'devices/{device_id}/alerts/entries')
            alerts_ref.listen(on_alert_change)
            
            info_ref = db_ref.child(f'devices/{device_id}/info')
            info_ref.listen(on_info_change)
            
            self.listeners[device_id] = {
                'current': current_ref,
                'alerts': alerts_ref,
                'info': info_ref
            }
            
            print(f"✅ Started Firebase listeners for device: {device_id}")
        except Exception as e:
            print(f"Error setting up Firebase listeners: {e}")
    
    def stop_listening_to_device(self, device_id: str):
        """Stop listening to Firebase changes for a device"""
        if device_id in self.listeners:
            # TODO: Implement listener cleanup if needed
            del self.listeners[device_id]
            print(f"❌ Stopped Firebase listeners for device: {device_id}")


# Global event bridge instance (lazy initialization)
event_bridge = None


def get_event_bridge():
    """Get or create event bridge instance"""
    global event_bridge
    if event_bridge is None:
        event_bridge = FirebaseEventBridge(manager)
    return event_bridge


def setup_websocket_routes(app):
    """Setup WebSocket routes in FastAPI app"""
    
    @app.websocket("/ws/devices/{device_id}")
    async def websocket_device(websocket: WebSocket, device_id: str, token: Optional[str] = None):
        """Device-specific WebSocket endpoint"""
        # Start Firebase listeners for this device
        get_event_bridge().start_listening_to_device(device_id)
        
        await websocket_device_endpoint(websocket, device_id, token)
    
    @app.websocket("/ws/organizations/{organization_id}")
    async def websocket_organization(websocket: WebSocket, organization_id: str, token: Optional[str] = None):
        """Organization-wide WebSocket endpoint"""
        await websocket_organization_endpoint(websocket, organization_id, token)
    
    @app.get("/api/websocket/stats")
    async def websocket_stats():
        """Get WebSocket connection statistics"""
        return {
            "success": True,
            "stats": manager.get_connection_count(),
            "timestamp": datetime.now().isoformat()
        }
    
    print("✅ WebSocket routes configured")
