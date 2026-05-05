"""
LumeEdge Telemetry REST API
Returns AGGREGATED telemetry data only (Zero-Trust: no raw data exposure)

Endpoints:
- GET /api/telemetry                    - Get aggregated telemetry
- GET /api/telemetry?device_id=X        - Filter by device
- GET /api/telemetry?hours=24           - Time range (default 24h)
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
    HTTP trigger for telemetry data API.
    Returns AGGREGATED telemetry data only (never raw IoT data).
    """
    try:
        # Parse query parameters
        device_id = req.params.get('device_id')
        hours = min(int(req.params.get('hours', '24')), 168)  # Max 7 days
        limit = min(int(req.params.get('limit', '100')), 1000)
        
        db = Database()
        
        # Get aggregated telemetry
        aggregates = db.get_telemetry_aggregates(
            device_id=device_id,
            hours=hours,
            limit=limit
        )
        
        response = {
            'success': True,
            'count': len(aggregates),
            'data_type': 'aggregated',  # Explicitly state this is aggregated
            'filters': {
                'device_id': device_id,
                'hours': hours,
                'limit': limit
            },
            'telemetry': aggregates
        }
        
        return func.HttpResponse(
            json.dumps(response),
            mimetype='application/json',
            status_code=200
        )
        
    except ValueError as e:
        return func.HttpResponse(
            json.dumps({'success': False, 'error': f'Invalid parameter: {e}'}),
            mimetype='application/json',
            status_code=400
        )
    except Exception as e:
        logger.error(f"Telemetry API error: {e}", exc_info=True)
        return func.HttpResponse(
            json.dumps({'success': False, 'error': 'Internal server error'}),
            mimetype='application/json',
            status_code=500
        )
