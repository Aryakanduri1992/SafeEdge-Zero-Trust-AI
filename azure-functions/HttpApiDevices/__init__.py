"""
LumeEdge Devices REST API
Endpoints for device management

Endpoints:
- GET  /api/devices          - List all devices
- GET  /api/devices/{id}     - Get device by ID
- POST /api/devices/{id}/block - Block a device
- POST /api/devices/{id}/unblock - Unblock a device
"""

import json
import logging
import azure.functions as func

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.database import Database
from shared.config import get_config

logger = logging.getLogger(__name__)


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP trigger for device management API.
    Routes based on HTTP method and path parameters.
    """
    
    try:
        # Get route parameters
        device_id = req.route_params.get('device_id')
        action = req.route_params.get('action')
        method = req.method.upper()
        
        db = Database()
        
        # Route: GET /api/devices - List all devices
        if method == 'GET' and not device_id:
            status_filter = req.params.get('status')
            devices = db.get_all_devices(status=status_filter)
            
            return func.HttpResponse(
                json.dumps({
                    'success': True,
                    'count': len(devices),
                    'devices': devices
                }),
                mimetype='application/json',
                status_code=200
            )
        
        # Route: GET /api/devices/{id} - Get single device
        if method == 'GET' and device_id and not action:
            device = db.get_device(device_id)
            
            if not device:
                return func.HttpResponse(
                    json.dumps({
                        'success': False,
                        'error': f'Device {device_id} not found'
                    }),
                    mimetype='application/json',
                    status_code=404
                )
            
            return func.HttpResponse(
                json.dumps({
                    'success': True,
                    'device': device
                }),
                mimetype='application/json',
                status_code=200
            )
        
        # Route: POST /api/devices/{id}/block - Block device
        if method == 'POST' and device_id and action == 'block':
            # Parse request body for reason
            try:
                body = req.get_json()
                reason = body.get('reason', 'Manually blocked via API')
            except:
                reason = 'Manually blocked via API'
            
            # Check device exists
            device = db.get_device(device_id)
            if not device:
                return func.HttpResponse(
                    json.dumps({
                        'success': False,
                        'error': f'Device {device_id} not found'
                    }),
                    mimetype='application/json',
                    status_code=404
                )
            
            # Block the device
            blocked = db.block_device(device_id, reason)
            
            # Log security event
            db.insert_security_event({
                'device_id': device_id,
                'event_type': 'device_blocked',
                'severity': 'high',
                'category': 'administrative',
                'title': f'Device {device_id} blocked via API',
                'description': reason,
                'action_taken': 'blocked'
            })
            
            logger.warning(f"Device {device_id} blocked via API: {reason}")
            
            return func.HttpResponse(
                json.dumps({
                    'success': blocked,
                    'device_id': device_id,
                    'status': 'blocked',
                    'reason': reason
                }),
                mimetype='application/json',
                status_code=200
            )
        
        # Route: POST /api/devices/{id}/unblock - Unblock device
        if method == 'POST' and device_id and action == 'unblock':
            device = db.get_device(device_id)
            if not device:
                return func.HttpResponse(
                    json.dumps({
                        'success': False,
                        'error': f'Device {device_id} not found'
                    }),
                    mimetype='application/json',
                    status_code=404
                )
            
            # Unblock by setting status to active
            with db.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE devices 
                    SET status = 'active',
                        blocked_at = NULL,
                        blocked_reason = NULL,
                        trust_score = 50.0,
                        updated_at = GETUTCDATE()
                    WHERE device_id = ?
                """, (device_id,))
                conn.commit()
            
            # Log security event
            db.insert_security_event({
                'device_id': device_id,
                'event_type': 'device_unblocked',
                'severity': 'info',
                'category': 'administrative',
                'title': f'Device {device_id} unblocked via API',
                'action_taken': 'unblocked'
            })
            
            logger.info(f"Device {device_id} unblocked via API")
            
            return func.HttpResponse(
                json.dumps({
                    'success': True,
                    'device_id': device_id,
                    'status': 'active',
                    'trust_score': 50.0
                }),
                mimetype='application/json',
                status_code=200
            )
        
        # Unknown route
        return func.HttpResponse(
            json.dumps({
                'success': False,
                'error': 'Invalid endpoint'
            }),
            mimetype='application/json',
            status_code=400
        )
        
    except Exception as e:
        logger.error(f"API error: {e}", exc_info=True)
        return func.HttpResponse(
            json.dumps({
                'success': False,
                'error': 'Internal server error'
            }),
            mimetype='application/json',
            status_code=500
        )
