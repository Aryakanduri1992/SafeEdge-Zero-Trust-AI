"""
Demo Control Service (Python)
Task 7.2: ESP32 attack simulation integration with AI pipeline
Manages physical hardware demos and attack simulations
"""

import asyncio
import json
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime
import firebase_admin
from firebase_admin import db

from security_response_pipeline import SecurityResponsePipeline
from phone_alert_service import PhoneAlertService


@dataclass
class ESP32Device:
    """ESP32 device information"""
    device_id: