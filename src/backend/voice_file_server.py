"""
Voice File Server for Twilio Integration
Serves ElevenLabs-generated voice files for phone calls
"""

import os
import threading
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote
import mimetypes

class VoiceFileHandler(SimpleHTTPRequestHandler):
    """Custom handler for serving voice files"""
    
    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from
        self.directory = os.path.abspath("audio_alerts")
        super().__init__(*args, directory=self.directory, **kwargs)
    
    def do_GET(self):
        """Handle GET requests for voice files"""
        try:
            # Parse the requested path
            path = unquote(self.path.lstrip('/'))
            
            # Security: only allow .mp3 files
            if not path.endswith('.mp3'):
                self.send_error(404, "File not found")
                return
            
            # Check if file exists
            file_path = os.path.join(self.directory, path)
            if not os.path.exists(file_path):
                self.send_error(404, "File not found")
                return
            
            # Serve the file
            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Content-Length', str(os.path.getsize(file_path)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())
                
        except Exception as e:
            print(f"Error serving voice file: {e}")
            self.send_error(500, "Internal server error")

class VoiceFileServer:
    """Simple HTTP server for voice files"""
    
    def __init__(self, port=8001):
        self.port = port
        self.server = None
        self.thread = None
        self.running = False
    
    def start(self):
        """Start the voice file server"""
        if self.running:
            return
        
        try:
            # Create server
            self.server = HTTPServer(('localhost', self.port), VoiceFileHandler)
            
            # Start in background thread
            self.thread = threading.Thread(target=self._run_server, daemon=True)
            self.thread.start()
            
            self.running = True
            print(f"🎵 Voice file server started on http://localhost:{self.port}")
            
            # Wait a moment for server to start
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ Failed to start voice file server: {e}")
    
    def _run_server(self):
        """Run the server in background"""
        try:
            self.server.serve_forever()
        except Exception as e:
            print(f"Voice file server error: {e}")
    
    def stop(self):
        """Stop the voice file server"""
        if self.server:
            self.server.shutdown()
            self.server.server_close()
        
        if self.thread:
            self.thread.join(timeout=1)
        
        self.running = False
        print("🎵 Voice file server stopped")
    
    def get_file_url(self, filename):
        """Get the URL for a voice file"""
        if not self.running:
            return None
        
        return f"http://localhost:{self.port}/{filename}"

# Global voice file server instance
voice_server = VoiceFileServer()

def start_voice_server():
    """Start the global voice file server"""
    voice_server.start()

def get_voice_file_url(filename):
    """Get URL for a voice file"""
    return voice_server.get_file_url(filename)

def stop_voice_server():
    """Stop the global voice file server"""
    voice_server.stop()