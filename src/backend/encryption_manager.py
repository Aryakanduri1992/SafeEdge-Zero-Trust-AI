"""
AES-256-GCM Encryption Manager
===============================
Handles encryption/decryption of data between ESP32 and backend.
Uses AES-256-GCM for authenticated encryption.
Stores encryption keys in Firebase Realtime Database.

Author: SafeEdge Team - Imagine Cup 2026
"""

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import secrets
import base64
from typing import Tuple, Optional
from datetime import datetime
import firebase_admin
from firebase_admin import db


class EncryptionManager:
    """
    Manages AES-256-GCM encryption for secure data transmission.
    """
    
    AES_KEY_SIZE = 32  # 256 bits
    GCM_NONCE_SIZE = 12  # 96 bits (recommended for GCM)
    GCM_TAG_SIZE = 16  # 128 bits
    
    def __init__(self, key: Optional[bytes] = None):
        """
        Initialize encryption manager.
        
        Args:
            key: 32-byte AES key. If None, generates a new key.
        """
        if key:
            if len(key) != self.AES_KEY_SIZE:
                raise ValueError(f"Key must be {self.AES_KEY_SIZE} bytes")
            self.key = key
        else:
            self.key = self.generate_key()
        
        self.aesgcm = AESGCM(self.key)
    
    @staticmethod
    def generate_key() -> bytes:
        """Generate a random 256-bit AES key"""
        return secrets.token_bytes(EncryptionManager.AES_KEY_SIZE)
    
    @staticmethod
    def generate_nonce() -> bytes:
        """Generate a random nonce for GCM"""
        return secrets.token_bytes(EncryptionManager.GCM_NONCE_SIZE)
    
    @staticmethod
    def derive_key_from_password(
        password: str,
        salt: Optional[bytes] = None,
        iterations: int = 100000
    ) -> Tuple[bytes, bytes]:
        """
        Derive AES key from password using PBKDF2.
        
        Args:
            password: Password string
            salt: Salt bytes (generated if None)
            iterations: PBKDF2 iterations
            
        Returns:
            Tuple of (key, salt)
        """
        if salt is None:
            salt = secrets.token_bytes(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=EncryptionManager.AES_KEY_SIZE,
            salt=salt,
            iterations=iterations,
            backend=default_backend()
        )
        
        key = kdf.derive(password.encode())
        return key, salt
    
    def encrypt(
        self,
        plaintext: bytes,
        associated_data: Optional[bytes] = None
    ) -> Tuple[bytes, bytes]:
        """
        Encrypt data using AES-256-GCM.
        
        Args:
            plaintext: Data to encrypt
            associated_data: Additional authenticated data (AAD)
            
        Returns:
            Tuple of (ciphertext, nonce)
            Note: GCM tag is appended to ciphertext
        """
        nonce = self.generate_nonce()
        ciphertext = self.aesgcm.encrypt(nonce, plaintext, associated_data)
        return ciphertext, nonce
    
    def decrypt(
        self,
        ciphertext: bytes,
        nonce: bytes,
        associated_data: Optional[bytes] = None
    ) -> bytes:
        """
        Decrypt data using AES-256-GCM.
        
        Args:
            ciphertext: Encrypted data (with tag appended)
            nonce: Nonce used for encryption
            associated_data: Additional authenticated data (AAD)
            
        Returns:
            Decrypted plaintext
            
        Raises:
            cryptography.exceptions.InvalidTag: If authentication fails
        """
        plaintext = self.aesgcm.decrypt(nonce, ciphertext, associated_data)
        return plaintext
    
    def encrypt_string(
        self,
        plaintext: str,
        associated_data: Optional[str] = None
    ) -> dict:
        """
        Encrypt string and return base64-encoded result.
        
        Args:
            plaintext: String to encrypt
            associated_data: Additional authenticated data
            
        Returns:
            Dict with base64-encoded ciphertext and nonce
        """
        aad = associated_data.encode() if associated_data else None
        ciphertext, nonce = self.encrypt(plaintext.encode(), aad)
        
        return {
            'ciphertext': base64.b64encode(ciphertext).decode(),
            'nonce': base64.b64encode(nonce).decode(),
            'algorithm': 'AES-256-GCM'
        }
    
    def decrypt_string(
        self,
        ciphertext_b64: str,
        nonce_b64: str,
        associated_data: Optional[str] = None
    ) -> str:
        """
        Decrypt base64-encoded ciphertext.
        
        Args:
            ciphertext_b64: Base64-encoded ciphertext
            nonce_b64: Base64-encoded nonce
            associated_data: Additional authenticated data
            
        Returns:
            Decrypted string
        """
        ciphertext = base64.b64decode(ciphertext_b64)
        nonce = base64.b64decode(nonce_b64)
        aad = associated_data.encode() if associated_data else None
        
        plaintext = self.decrypt(ciphertext, nonce, aad)
        return plaintext.decode()
    
    def get_key_base64(self) -> str:
        """Get encryption key as base64 string"""
        return base64.b64encode(self.key).decode()
    
    @staticmethod
    def key_from_base64(key_b64: str) -> bytes:
        """Convert base64 key to bytes"""
        return base64.b64decode(key_b64)


class DeviceEncryptionManager:
    """
    Manages encryption keys for multiple devices.
    Each device has its own encryption key.
    Stores keys in Firebase Realtime Database.
    """
    
    def __init__(self):
        self.device_keys: dict = {}  # device_id -> EncryptionManager
        
        # Firebase references - initialized lazily
        self.db_ref = None
        self.keys_ref = None
        self._firebase_initialized = False
        
        # Try to initialize Firebase and load data
        self._ensure_firebase_initialized()
    
    def _ensure_firebase_initialized(self):
        """Ensure Firebase is initialized before accessing it"""
        if self._firebase_initialized:
            return
            
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                print("⚠️  Firebase not initialized yet for encryption manager, will retry when needed")
                return
                
            # Initialize Firebase references
            self.db_ref = db.reference()
            self.keys_ref = self.db_ref.child('encryption_keys')
            self._firebase_initialized = True
            
            # Load existing keys from Firebase
            self._load_keys_from_firebase()
            
            print("✅ Device Encryption Manager Firebase connection established")
            
        except Exception as e:
            print(f"⚠️  Firebase initialization failed in Device Encryption Manager: {e}")
            # Don't raise exception, just log it - we'll retry later
    
    def _load_keys_from_firebase(self):
        """Load encryption keys from Firebase"""
        if not self._firebase_initialized:
            return
            
        try:
            keys_data = self.keys_ref.get()
            if keys_data:
                for device_id, key_info in keys_data.items():
                    key_b64 = key_info.get('key')
                    if key_b64:
                        key = EncryptionManager.key_from_base64(key_b64)
                        self.device_keys[device_id] = EncryptionManager(key)
                print(f"✅ Loaded {len(self.device_keys)} encryption keys from Firebase")
        except Exception as e:
            print(f"ℹ️  No encryption keys in Firebase: {e}")
    
    def _save_key_to_firebase(self, device_id: str, enc_manager: EncryptionManager):
        """Save encryption key to Firebase"""
        self._ensure_firebase_initialized()
        if not self._firebase_initialized:
            print("⚠️  Cannot save encryption key to Firebase - not initialized")
            return
            
        try:
            self.keys_ref.child(device_id).set({
                'key': enc_manager.get_key_base64(),
                'algorithm': 'AES-256-GCM',
                'created_at': datetime.now().isoformat()
            })
        except Exception as e:
            print(f"❌ Failed to save encryption key to Firebase: {e}")
    
    def add_device(self, device_id: str, key: Optional[bytes] = None) -> EncryptionManager:
        """
        Add device with encryption key.
        
        Args:
            device_id: Device identifier
            key: Encryption key (generated if None)
            
        Returns:
            EncryptionManager for the device
        """
        # Ensure Firebase is initialized
        self._ensure_firebase_initialized()
        
        if device_id in self.device_keys:
            print(f"⚠️  Device {device_id} already has encryption key")
            return self.device_keys[device_id]
        
        # Generate or use provided key
        if key is None:
            key = EncryptionManager.generate_key()
        
        enc_manager = EncryptionManager(key)
        self.device_keys[device_id] = enc_manager
        
        # Save to Firebase (only if Firebase is initialized)
        self._save_key_to_firebase(device_id, enc_manager)
        
        print(f"🔑 Encryption key added for device: {device_id}")
        
        return enc_manager
    
    def get_device_manager(self, device_id: str) -> Optional[EncryptionManager]:
        """Get encryption manager for device"""
        return self.device_keys.get(device_id)
    
    def remove_device(self, device_id: str):
        """Remove device encryption key"""
        # Ensure Firebase is initialized
        self._ensure_firebase_initialized()
        
        if device_id in self.device_keys:
            del self.device_keys[device_id]
            
            # Remove from Firebase (only if Firebase is initialized)
            if self._firebase_initialized:
                try:
                    self.keys_ref.child(device_id).delete()
                    print(f"🗑️ Encryption key removed for device: {device_id}")
                except Exception as e:
                    print(f"❌ Failed to remove key from Firebase: {e}")
            else:
                print(f"🗑️ Encryption key removed locally for device: {device_id} (Firebase not available)")
    
    def encrypt_for_device(
        self,
        device_id: str,
        plaintext: bytes,
        associated_data: Optional[bytes] = None
    ) -> Optional[Tuple[bytes, bytes]]:
        """Encrypt data for specific device"""
        manager = self.get_device_manager(device_id)
        if not manager:
            return None
        return manager.encrypt(plaintext, associated_data)
    
    def decrypt_from_device(
        self,
        device_id: str,
        ciphertext: bytes,
        nonce: bytes,
        associated_data: Optional[bytes] = None
    ) -> Optional[bytes]:
        """Decrypt data from specific device"""
        manager = self.get_device_manager(device_id)
        if not manager:
            return None
        return manager.decrypt(ciphertext, nonce, associated_data)
    
    def get_device_count(self) -> int:
        """Get number of devices with encryption keys"""
        return len(self.device_keys)
    
    def get_device_key_base64(self, device_id: str) -> Optional[str]:
        """Get device encryption key as base64"""
        manager = self.get_device_manager(device_id)
        if not manager:
            return None
        return manager.get_key_base64()


# Singleton instance
_device_encryption_manager = None

def get_device_encryption_manager() -> DeviceEncryptionManager:
    """Get singleton instance of DeviceEncryptionManager"""
    global _device_encryption_manager
    if _device_encryption_manager is None:
        _device_encryption_manager = DeviceEncryptionManager()
        
    # Ensure Firebase is initialized
    _device_encryption_manager._ensure_firebase_initialized()
    
    return _device_encryption_manager
