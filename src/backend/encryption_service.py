"""
SafeEdge Encryption Service - AES-256-GCM Implementation
Provides end-to-end encryption for sensor data
"""

import base64
import json
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
from typing import Dict, Any, Tuple, Optional
import secrets

class EncryptionService:
    """AES-256-GCM encryption service for sensor data"""
    
    def __init__(self, device_key: str = None):
        """Initialize with device-specific key"""
        self.device_key = device_key or self._generate_device_key()
        self.backend = default_backend()
    
    def _generate_device_key(self) -> str:
        """Generate a new device key"""
        return base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
    
    def _derive_key(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key from password and salt"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits
            salt=salt,
            iterations=100000,
            backend=self.backend
        )
        return kdf.derive(password.encode())
    
    def encrypt_sensor_data(self, sensor_data: Dict[str, Any], device_id: str) -> Dict[str, str]:
        """
        Encrypt sensor data using AES-256-GCM
        Returns encrypted payload with metadata
        """
        try:
            # Convert sensor data to JSON
            plaintext = json.dumps(sensor_data, sort_keys=True)
            
            # Generate salt and IV
            salt = secrets.token_bytes(16)
            iv = secrets.token_bytes(12)  # GCM recommended IV size
            
            # Derive key from device key and salt
            key = self._derive_key(self.device_key, salt)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(key),
                modes.GCM(iv),
                backend=self.backend
            )
            encryptor = cipher.encryptor()
            
            # Add device_id as additional authenticated data
            encryptor.authenticate_additional_data(device_id.encode())
            
            # Encrypt data
            ciphertext = encryptor.update(plaintext.encode()) + encryptor.finalize()
            
            # Create encrypted payload
            encrypted_payload = {
                'encrypted_data': base64.b64encode(ciphertext).decode('utf-8'),
                'salt': base64.b64encode(salt).decode('utf-8'),
                'iv': base64.b64encode(iv).decode('utf-8'),
                'tag': base64.b64encode(encryptor.tag).decode('utf-8'),
                'algorithm': 'AES-256-GCM',
                'device_id': device_id,
                'encrypted_at': sensor_data.get('timestamp', ''),
                'data_hash': self._calculate_hash(plaintext)
            }
            
            return encrypted_payload
            
        except Exception as e:
            raise Exception(f"Encryption failed: {str(e)}")
    
    def decrypt_sensor_data(self, encrypted_payload: Dict[str, str]) -> Dict[str, Any]:
        """
        Decrypt sensor data using AES-256-GCM
        Returns original sensor data
        """
        try:
            # Extract components
            ciphertext = base64.b64decode(encrypted_payload['encrypted_data'])
            salt = base64.b64decode(encrypted_payload['salt'])
            iv = base64.b64decode(encrypted_payload['iv'])
            tag = base64.b64decode(encrypted_payload['tag'])
            device_id = encrypted_payload['device_id']
            
            # Derive key
            key = self._derive_key(self.device_key, salt)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(key),
                modes.GCM(iv, tag),
                backend=self.backend
            )
            decryptor = cipher.decryptor()
            
            # Add device_id as additional authenticated data
            decryptor.authenticate_additional_data(device_id.encode())
            
            # Decrypt data
            plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            
            # Parse JSON
            sensor_data = json.loads(plaintext.decode())
            
            # Verify hash
            if self._calculate_hash(plaintext.decode()) != encrypted_payload.get('data_hash'):
                raise Exception("Data integrity check failed")
            
            return sensor_data
            
        except Exception as e:
            raise Exception(f"Decryption failed: {str(e)}")
    
    def _calculate_hash(self, data: str) -> str:
        """Calculate SHA-256 hash of data for integrity check"""
        digest = hashes.Hash(hashes.SHA256(), backend=self.backend)
        digest.update(data.encode())
        return base64.b64encode(digest.finalize()).decode('utf-8')
    
    def get_device_key(self) -> str:
        """Get the device encryption key"""
        return self.device_key
    
    def rotate_key(self) -> str:
        """Generate and return a new device key"""
        self.device_key = self._generate_device_key()
        return self.device_key

# Global encryption service instance
_encryption_service = None

def get_encryption_service(device_id: str = None) -> EncryptionService:
    """Get or create encryption service instance"""
    global _encryption_service
    
    if _encryption_service is None:
        # In production, retrieve device key from secure storage
        device_key = get_device_encryption_key(device_id) if device_id else None
        _encryption_service = EncryptionService(device_key)
    
    return _encryption_service

def get_device_encryption_key(device_id: str) -> str:
    """
    Retrieve device encryption key from Firebase
    In production, this would be stored securely
    """
    try:
        from firebase_admin import db
        
        # Get key from Firebase encryption_keys
        key_ref = db.reference(f'encryption_keys/{device_id}')
        key_data = key_ref.get()
        
        if key_data and 'key' in key_data:
            return key_data['key']
        else:
            # Generate new key if not found
            new_key = base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
            key_ref.set({
                'key': new_key,
                'algorithm': 'AES-256-GCM',
                'created_at': json.dumps({"timestamp": "now"}, default=str)
            })
            return new_key
            
    except Exception as e:
        print(f"Warning: Could not retrieve device key: {e}")
        # Fallback to generated key
        return base64.b64encode(secrets.token_bytes(32)).decode('utf-8')

# Utility functions for easy encryption/decryption
def encrypt_data(data: Dict[str, Any], device_id: str) -> Dict[str, str]:
    """Convenience function to encrypt sensor data"""
    service = get_encryption_service(device_id)
    return service.encrypt_sensor_data(data, device_id)

def decrypt_data(encrypted_payload: Dict[str, str]) -> Dict[str, Any]:
    """Convenience function to decrypt sensor data"""
    device_id = encrypted_payload.get('device_id')
    service = get_encryption_service(device_id)
    return service.decrypt_sensor_data(encrypted_payload)