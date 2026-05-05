"""
LumeEdge Dashboard REST API
Aggregated statistics and metrics for the frontend dashboard

Endpoints:
- GET /api/dashboard/stats    - Get aggregated dashboard statistics
- GET /api/dashboard/health   - Get system health status
"""

import json
import logging
import azure.functions as func
from datetime import datetime

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.database import Database
from shared.config import get_config

logger = logging.getLogger(__name__)


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP trigger for dashboard statistics API.
    Provides aggregated metrics for the frontend.
    """
    
    try:
        # Get route parameter
        endpoint = req.route_params.get('endpoint', 'stats')
        
        db = Database()
        config = get_config()
        
        # Route: GET /api/dashboard/stats
        if endpoint == 'stats':
            stats = db.get_dashboard_stats()
            
            # Add system info
            stats['system'] = {
                'timestamp': datetime.utcnow().isoformat(),
                'anomaly_detection_enabled': config.enable_anomaly_detection,
                'phone_alerts_enabled': config.enable_phone_alerts,
                'registered_devices': len(config.allowed_device_ids)
            }
            
            return func.HttpResponse(
                json.dumps({
                    'success': True,
                    'stats': stats
                }),
                mimetype='application/json',
                status_code=200
            )
        
        # Route: GET /api/dashboard/health
        if endpoint == 'health':
            # Check database connectivity
            db_healthy = False
            try:
                with db.get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT 1")
                    db_healthy = True
            except:
                pass
            
            # Check Twilio configuration
            twilio_configured = config.has_twilio_config()
            
            health = {
                'status': 'healthy' if db_healthy else 'degraded',
                'timestamp': datetime.utcnow().isoformat(),
                'components': {
                    'database': {
                        'status': 'healthy' if db_healthy else 'unhealthy',
                        'type': 'Azure SQL'
                    },
                    'iot_hub': {
                        'status': 'configured',
                        'name': config.iothub_name
                    },
                    'alerts': {
                        'status': 'configured' if twilio_configured else 'not_configured',
                        'phone_alerts': config.enable_phone_alerts
                    },
                    'anomaly_detection': {
                        'status': 'enabled' if config.enable_anomaly_detection else 'disabled'
                    }
                }
            }
            
            return func.HttpResponse(
                json.dumps({
                    'success': True,
                    'health': health
                }),
                mimetype='application/json',
                status_code=200
            )
        
        # Route: GET /api/dashboard/threats - Active threats summary
        if endpoint == 'threats':
            events = db.get_security_events(
                unresolved_only=True,
                limit=50
            )
            
            # Group by severity
            threats_by_severity = {
                'critical': [],
                'high': [],
                'medium': [],
                'low': []
            }
            
            for event in events:
                sev = event.get('severity', 'low')
                if sev in threats_by_severity:
                    threats_by_severity[sev].append({
                        'event_id': event['event_id'],
                        'device_id': event['device_id'],
                        'title': event['title'],
                        'attack_type': event['attack_type'],
                        'created_at': event['created_at']
                    })
            
            return func.HttpResponse(
                json.dumps({
                    'success': True,
                    'active_threats': {
                        'total': len(events),
                        'critical_count': len(threats_by_severity['critical']),
                        'high_count': len(threats_by_severity['high']),
                        'by_severity': threats_by_severity
                    }
                }),
                mimetype='application/json',
                status_code=200
            )
        
        # Unknown endpoint
        return func.HttpResponse(
            json.dumps({
                'success': False,
                'error': f'Unknown dashboard endpoint: {endpoint}'
            }),
            mimetype='application/json',
            status_code=404
        )
        
    except Exception as e:
        logger.error(f"Dashboard API error: {e}", exc_info=True)
        return func.HttpResponse(
            json.dumps({
                'success': False,
                'error': 'Internal server error'
            }),
            mimetype='application/json',
            status_code=500
        )
