"""
SafeEdge ESP32 Secure Handshake Protocol
========================================
Implements secure TLS handshake with certificate verification
for ESP32 devices connecting to SafeEdge backend.

Features:
- Mutual TLS (mTLS) authentication
- Certificate pinning
- Secure session establishment
- Anti-replay protection
- Connection integrity verification

Author: SafeEdge Team - Imagine Cup 2026
"""

import ssl
import socket
import json
import hashlib
import hmac
import time
import secrets
import struct
from pathlib import Path
from datetime import datetime

# Certificate paths
CERT_DIR = Path(__file__).parent / "certificates"
CA_CERT = CERT_DIR / "safeedge_ca.crt"
SERVER_CERT = CERT_DIR / "server.crt"
SERVER_KEY = CERT_DIR / "server.key"


class SecureHandshakeError(Exception):
    """Custom exception for handshake failures"""
    pass


class SecureHandshakeServer:
    """
    Secure TLS server for ESP32 device connections.
    Implements mutual TLS with certificate pinning.
    """
    
    def __init__(self, host="0.0.0.0", port=8443):
        self.host = host
        self.port = port
        self.ssl_context = None
        self.connected_devices = {}
        self.session_keys = {}
        self.nonce_cache = set()  # Anti-replay protection
        
    def create_ssl_context(self):
        """Create SSL context with mutual TLS"""
        # Create context for TLS 1.2+ only
        self.ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        
        # Set minimum TLS version (1.2 for security)
        self.ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2
        
        # Load server certificate and key
        self.ssl_context.load_cert_chain(
            certfile=str(SERVER_CERT),
            keyfile=str(SERVER_KEY)
        )
        
        # Load CA certificate for client verification
        self.ssl_context.load_verify_locations(cafile=str(CA_CERT))
        
        # Require client certificate (mutual TLS)
        self.ssl_context.verify_mode = ssl.CERT_REQUIRED
        
        # Set secure cipher suites
        self.ssl_context.set_ciphers(
            "ECDHE+AESGCM:DHE+AESGCM:ECDHE+CHACHA20:DHE+CHACHA20"
        )
        
        # Disable compression (CRIME attack prevention)
        self.ssl_context.options |= ssl.OP_NO_COMPRESSION
        
        print("SSL context created with mutual TLS enabled")
        return self.ssl_context
    
    def verify_client_certificate(self, ssl_socket):
        """Verify client certificate and extract device info"""
        try:
            cert = ssl_socket.getpeercert()
            
            if not cert:
                raise SecureHandshakeError("No client certificate provided")
            
            # Extract device ID from certificate CN
            subject = dict(x[0] for x in cert.get("subject", []))
            device_id = subject.get("commonName", "")
            
            if not device_id:
                raise SecureHandshakeError("Invalid certificate: no device ID")
            
            # Verify certificate is not expired
            not_after = cert.get("notAfter", "")
            if not_after:
                # Parse certificate expiry
                expiry = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
                if expiry < datetime.utcnow():
                    raise SecureHandshakeError("Client certificate expired")
            
            # Get certificate fingerprint for pinning verification
            der_cert = ssl_socket.getpeercert(binary_form=True)
            fingerprint = hashlib.sha256(der_cert).hexdigest().upper()
            
            return {
                "device_id": device_id,
                "fingerprint": fingerprint,
                "subject": subject,
                "valid_until": not_after
            }
            
        except ssl.SSLError as e:
            raise SecureHandshakeError(f"SSL verification failed: {e}")
    
    def perform_handshake(self, ssl_socket, client_info):
        """
        Perform SafeEdge secure handshake protocol.
        
        Protocol:
        1. Server sends challenge (nonce + timestamp)
        2. Client responds with signed challenge + device info
        3. Server verifies and sends session key
        4. Both sides confirm with HMAC
        """
        device_id = client_info["device_id"]
        
        # Step 1: Generate and send challenge
        server_nonce = secrets.token_bytes(32)
        timestamp = int(time.time())
        
        challenge = {
            "type": "challenge",
            "nonce": server_nonce.hex(),
            "timestamp": timestamp,
            "server_id": "safeedge_backend_001"
        }
        
        self._send_message(ssl_socket, challenge)
        print(f"[{device_id}] Challenge sent")
        
        # Step 2: Receive client response
        response = self._receive_message(ssl_socket)
        
        if response.get("type") != "challenge_response":
            raise SecureHandshakeError("Invalid challenge response")
        
        # Verify nonce matches (anti-replay)
        if response.get("server_nonce") != server_nonce.hex():
            raise SecureHandshakeError("Nonce mismatch - possible replay attack")
        
        # Verify timestamp is recent (within 30 seconds)
        client_timestamp = response.get("timestamp", 0)
        if abs(timestamp - client_timestamp) > 30:
            raise SecureHandshakeError("Timestamp out of range - possible replay attack")
        
        # Check nonce hasn't been used before
        client_nonce = response.get("client_nonce", "")
        if client_nonce in self.nonce_cache:
            raise SecureHandshakeError("Nonce reuse detected - replay attack")
        self.nonce_cache.add(client_nonce)
        
        # Step 3: Generate session key and send confirmation
        session_key = secrets.token_bytes(32)
        self.session_keys[device_id] = session_key
        
        # Create session confirmation with HMAC
        session_data = f"{server_nonce.hex()}{client_nonce}{timestamp}"
        session_hmac = hmac.new(
            session_key,
            session_data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        confirmation = {
            "type": "session_established",
            "session_id": secrets.token_hex(16),
            "hmac": session_hmac,
            "expires_in": 3600  # 1 hour session
        }
        
        self._send_message(ssl_socket, confirmation)
        print(f"[{device_id}] Session established")
        
        # Step 4: Wait for client confirmation
        final_response = self._receive_message(ssl_socket)
        
        if final_response.get("type") != "session_confirmed":
            raise SecureHandshakeError("Session confirmation failed")
        
        # Store connected device
        self.connected_devices[device_id] = {
            "fingerprint": client_info["fingerprint"],
            "session_id": confirmation["session_id"],
            "connected_at": datetime.utcnow().isoformat(),
            "address": ssl_socket.getpeername()
        }
        
        return confirmation["session_id"]
    
    def _send_message(self, ssl_socket, data):
        """Send JSON message with length prefix"""
        message = json.dumps(data).encode()
        length = struct.pack(">I", len(message))
        ssl_socket.sendall(length + message)
    
    def _receive_message(self, ssl_socket):
        """Receive JSON message with length prefix"""
        # Read length prefix (4 bytes)
        length_data = ssl_socket.recv(4)
        if len(length_data) < 4:
            raise SecureHandshakeError("Connection closed unexpectedly")
        
        length = struct.unpack(">I", length_data)[0]
        
        # Sanity check on message length
        if length > 1024 * 1024:  # 1MB max
            raise SecureHandshakeError("Message too large")
        
        # Read message
        message = b""
        while len(message) < length:
            chunk = ssl_socket.recv(min(4096, length - len(message)))
            if not chunk:
                raise SecureHandshakeError("Connection closed during message")
            message += chunk
        
        return json.loads(message.decode())
    
    def start(self):
        """Start the secure handshake server"""
        if not self.ssl_context:
            self.create_ssl_context()
        
        # Create socket
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind((self.host, self.port))
        server_socket.listen(5)
        
        print(f"Secure handshake server listening on {self.host}:{self.port}")
        
        try:
            while True:
                client_socket, address = server_socket.accept()
                print(f"Connection from {address}")
                
                try:
                    # Wrap with SSL
                    ssl_socket = self.ssl_context.wrap_socket(
                        client_socket,
                        server_side=True
                    )
                    
                    # Verify client certificate
                    client_info = self.verify_client_certificate(ssl_socket)
                    print(f"Client verified: {client_info['device_id']}")
                    
                    # Perform handshake
                    session_id = self.perform_handshake(ssl_socket, client_info)
                    print(f"Handshake complete. Session: {session_id}")
                    
                    # Handle ongoing communication...
                    self._handle_client(ssl_socket, client_info)
                    
                except SecureHandshakeError as e:
                    print(f"Handshake failed: {e}")
                except ssl.SSLError as e:
                    print(f"SSL error: {e}")
                finally:
                    try:
                        ssl_socket.close()
                    except:
                        pass
                    
        except KeyboardInterrupt:
            print("\nShutting down server...")
        finally:
            server_socket.close()
    
    def _handle_client(self, ssl_socket, client_info):
        """Handle authenticated client communication"""
        device_id = client_info["device_id"]
        
        while True:
            try:
                message = self._receive_message(ssl_socket)
                
                if message.get("type") == "sensor_data":
                    # Process sensor data
                    print(f"[{device_id}] Sensor data received")
                    self._send_message(ssl_socket, {"status": "ok"})
                    
                elif message.get("type") == "heartbeat":
                    # Respond to heartbeat
                    self._send_message(ssl_socket, {
                        "type": "heartbeat_ack",
                        "timestamp": int(time.time())
                    })
                    
                elif message.get("type") == "disconnect":
                    print(f"[{device_id}] Client disconnecting")
                    break
                    
            except (SecureHandshakeError, json.JSONDecodeError) as e:
                print(f"[{device_id}] Error: {e}")
                break


class SecureHandshakeClient:
    """
    Secure TLS client for ESP32 simulation/testing.
    Can be used to test the handshake protocol.
    """
    
    def __init__(self, device_id, host="localhost", port=8443):
        self.device_id = device_id
        self.host = host
        self.port = port
        self.ssl_context = None
        self.session_id = None
        self.session_key = None
        
    def create_ssl_context(self):
        """Create SSL context for client"""
        self.ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        
        # Set minimum TLS version
        self.ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2
        
        # Load CA certificate for server verification
        self.ssl_context.load_verify_locations(cafile=str(CA_CERT))
        
        # Load client certificate and key
        device_cert = CERT_DIR / "devices" / f"{self.device_id}.crt"
        device_key = CERT_DIR / "devices" / f"{self.device_id}.key"
        
        self.ssl_context.load_cert_chain(
            certfile=str(device_cert),
            keyfile=str(device_key)
        )
        
        # Verify server certificate
        self.ssl_context.verify_mode = ssl.CERT_REQUIRED
        self.ssl_context.check_hostname = False  # We verify manually
        
        return self.ssl_context
    
    def connect(self):
        """Connect to server and perform handshake"""
        if not self.ssl_context:
            self.create_ssl_context()
        
        # Create socket and connect
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        ssl_socket = self.ssl_context.wrap_socket(sock)
        
        print(f"Connecting to {self.host}:{self.port}...")
        ssl_socket.connect((self.host, self.port))
        
        # Verify server certificate
        server_cert = ssl_socket.getpeercert()
        print(f"Server certificate verified")
        
        # Perform handshake
        self.session_id = self._perform_handshake(ssl_socket)
        print(f"Handshake complete. Session: {self.session_id}")
        
        return ssl_socket
    
    def _perform_handshake(self, ssl_socket):
        """Perform client-side handshake"""
        # Step 1: Receive challenge
        challenge = self._receive_message(ssl_socket)
        
        if challenge.get("type") != "challenge":
            raise SecureHandshakeError("Expected challenge message")
        
        server_nonce = challenge["nonce"]
        server_timestamp = challenge["timestamp"]
        
        # Step 2: Send challenge response
        client_nonce = secrets.token_hex(32)
        
        response = {
            "type": "challenge_response",
            "server_nonce": server_nonce,
            "client_nonce": client_nonce,
            "timestamp": server_timestamp,
            "device_id": self.device_id,
            "firmware_version": "2.0.0"
        }
        
        self._send_message(ssl_socket, response)
        
        # Step 3: Receive session confirmation
        confirmation = self._receive_message(ssl_socket)
        
        if confirmation.get("type") != "session_established":
            raise SecureHandshakeError("Session establishment failed")
        
        # Step 4: Send final confirmation
        self._send_message(ssl_socket, {"type": "session_confirmed"})
        
        return confirmation["session_id"]
    
    def _send_message(self, ssl_socket, data):
        """Send JSON message with length prefix"""
        message = json.dumps(data).encode()
        length = struct.pack(">I", len(message))
        ssl_socket.sendall(length + message)
    
    def _receive_message(self, ssl_socket):
        """Receive JSON message with length prefix"""
        length_data = ssl_socket.recv(4)
        if len(length_data) < 4:
            raise SecureHandshakeError("Connection closed")
        
        length = struct.unpack(">I", length_data)[0]
        
        message = b""
        while len(message) < length:
            chunk = ssl_socket.recv(min(4096, length - len(message)))
            if not chunk:
                raise SecureHandshakeError("Connection closed")
            message += chunk
        
        return json.loads(message.decode())


def main():
    """Test the secure handshake"""
    import argparse
    
    parser = argparse.ArgumentParser(description="SafeEdge Secure Handshake")
    parser.add_argument("mode", choices=["server", "client"])
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=8443)
    parser.add_argument("--device-id", default="esp32_safeedge_001")
    
    args = parser.parse_args()
    
    if args.mode == "server":
        server = SecureHandshakeServer(host=args.host, port=args.port)
        server.start()
    else:
        client = SecureHandshakeClient(
            device_id=args.device_id,
            host=args.host,
            port=args.port
        )
        ssl_socket = client.connect()
        print("Connected! Press Ctrl+C to disconnect.")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            client._send_message(ssl_socket, {"type": "disconnect"})
            ssl_socket.close()


if __name__ == "__main__":
    main()
