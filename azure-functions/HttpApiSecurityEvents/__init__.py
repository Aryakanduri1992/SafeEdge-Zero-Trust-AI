"""
LumeEdge Security Events REST API
Endpoints for security event access and management

Endpoints:
- GET /api/security-events                    - Get recent security events
- GET /api/security-events?severity=critical  - Filter by severity
- GET /api/security-events?unresolved=1       - Get unresolved events only
- GET /api/security-events?device_id=X        - Filter by device
"""

import json
import logging
import azure.functions as func

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.database import Database

logger = logging.getLogger(__name__)


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP trigger for security events API.
    Provides access to security incidents and alerts.
    """
    
    try:
        # Parse query parameters
        device_id = req.params.get('device_id')
        severity = req.params.get('severity')
        unresolved_only = req.params.get('unresolved', '0') == '1'
        limit = min(int(req.params.get('limit', '100')), 500)  # Max 500
        
        # Validate severity if provided
        valid_severities = ['critical', 'high', 'medium', 'low', 'info']
        if severity and severity not in valid_severities:
            return func.HttpResponse(
                json.dumps({
                    'success': False,
                    'error': f'Invalid severity. Must be one of: {valid_severities}'
                }),
                mimetype='application/json',
                status_code=400
            )
        
        db = Database()
        
        # Get security events with filters
        events = db.get_security_events(
            device_id=device_id,
            severity=severity,
            unresolved_only=unresolved_only,
            limit=limit
        )
        
        # Calculate summary stats
        summary = {
            'total': len(events),
            'by_severity': {}
        }
        for event in events:
            sev = event.get('severity', 'unknown')
            summary['by_severity'][sev] = summary['by_severity'].get(sev, 0) + 1
        
        # Build response
        response = {
            'success': True,
            'summary': summary,
            'filters': {
                'device_id': device_id,
                'severity': severity,
                'unresolved_only': unresolved_only,
                'limit': limit
            },
            'events': events
        }
        
        return func.HttpResponse(
            json.dumps(response),
            mimetype='application/json',
            status_code=200
        )
        
    except ValueError as e:
        return func.HttpResponse(
            json.dumps({
                'success': False,
                'error': f'Invalid parameter: {e}'
            }),
            mimetype='application/json',
            status_code=400
        )
        
    except Exception as e:
        logger.error(f"Security Events API error: {e}", exc_info=True)
        return func.HttpResponse(
            json.dumps({
                'success': False,
                'error': 'Internal server error'
            }),
            mimetype='application/json',
            status_code=500
        )
