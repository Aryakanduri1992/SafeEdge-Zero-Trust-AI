"""
Local Voice Player Service
Alternative to Twilio - plays voice alerts directly on computer speakers
Perfect for Imagine Cup demonstrations
"""

import os
import subprocess
import platform
import threading
import time
from typing import Optional

class LocalVoicePlayer:
    """Play voice alerts locally on computer speakers"""
    
    def __init__(self):
        self.system = platform.system().lower()
        self.audio_dir = "audio_alerts"
        
        print("🔊 Local Voice Player initialized")
        print(f"   System: {self.system}")
        print(f"   Audio directory: {self.audio_dir}")
    
    def play_voice_alert(self, audio_path: str, message: str = "") -> bool:
        """
        Play voice alert on computer speakers
        
        Args:
            audio_path: Path to the MP3 voice file
            message: Text message to display
            
        Returns:
            bool: True if successful
        """
        if not os.path.exists(audio_path):
            print(f"❌ Audio file not found: {audio_path}")
            return False
        
        print(f"\n🔊 PLAYING VOICE ALERT:")
        print(f"   File: {os.path.basename(audio_path)}")
        if message:
            print(f"   Message: {message}")
        print(f"   🎵 Listen to your computer speakers...")
        
        try:
            # Play audio based on operating system
            if self.system == "windows":
                return self._play_windows(audio_path)
            elif self.system == "darwin":  # macOS
                return self._play_macos(audio_path)
            elif self.system == "linux":
                return self._play_linux(audio_path)
            else:
                print(f"❌ Unsupported system: {self.system}")
                return False
                
        except Exception as e:
            print(f"❌ Audio playback failed: {e}")
            return False
    
    def _play_windows(self, audio_path: str) -> bool:
        """Play audio on Windows"""
        try:
            # Try Windows Media Player first
            subprocess.run([
                "powershell", 
                f"Add-Type -AssemblyName presentationCore; $mediaPlayer = New-Object system.windows.media.mediaplayer; $mediaPlayer.open('{audio_path}'); $mediaPlayer.Play(); Start-Sleep 10"
            ], check=True, capture_output=True)
            return True
        except:
            try:
                # Fallback to start command
                subprocess.run(["start", audio_path], shell=True, check=True)
                return True
            except Exception as e:
                print(f"Windows audio playback failed: {e}")
                return False
    
    def _play_macos(self, audio_path: str) -> bool:
        """Play audio on macOS"""
        try:
            subprocess.run(["afplay", audio_path], check=True)
            return True
        except Exception as e:
            print(f"macOS audio playback failed: {e}")
            return False
    
    def _play_linux(self, audio_path: str) -> bool:
        """Play audio on Linux"""
        try:
            # Try different Linux audio players
            players = ["mpg123", "mpv", "vlc", "aplay"]
            for player in players:
                try:
                    subprocess.run([player, audio_path], check=True, capture_output=True)
                    return True
                except:
                    continue
            return False
        except Exception as e:
            print(f"Linux audio playback failed: {e}")
            return False
    
    def play_latest_voice_alert(self) -> bool:
        """Play the most recent voice alert file"""
        try:
            # Get all voice files
            voice_files = [
                f for f in os.listdir(self.audio_dir) 
                if f.startswith("voice_") and f.endswith(".mp3")
            ]
            
            if not voice_files:
                print("❌ No voice alert files found")
                return False
            
            # Sort by creation time (newest first)
            voice_files.sort(key=lambda x: os.path.getctime(os.path.join(self.audio_dir, x)), reverse=True)
            latest_file = os.path.join(self.audio_dir, voice_files[0])
            
            print(f"🎵 Playing latest voice alert: {voice_files[0]}")
            return self.play_voice_alert(latest_file)
            
        except Exception as e:
            print(f"❌ Could not play latest voice alert: {e}")
            return False
    
    def list_voice_alerts(self) -> list:
        """List all available voice alert files"""
        try:
            voice_files = [
                f for f in os.listdir(self.audio_dir) 
                if f.startswith("voice_") and f.endswith(".mp3")
            ]
            
            # Sort by creation time (newest first)
            voice_files.sort(key=lambda x: os.path.getctime(os.path.join(self.audio_dir, x)), reverse=True)
            
            print(f"\n🎵 Available Voice Alerts ({len(voice_files)}):")
            for i, file in enumerate(voice_files, 1):
                file_path = os.path.join(self.audio_dir, file)
                size = os.path.getsize(file_path)
                mtime = time.ctime(os.path.getctime(file_path))
                print(f"   {i}. {file} ({size} bytes, {mtime})")
            
            return voice_files
            
        except Exception as e:
            print(f"❌ Could not list voice alerts: {e}")
            return []
    
    def play_demo_sequence(self) -> bool:
        """Play a sequence of voice alerts for demonstration"""
        voice_files = self.list_voice_alerts()
        
        if not voice_files:
            print("❌ No voice alerts to play")
            return False
        
        print(f"\n🎭 DEMO MODE: Playing {len(voice_files)} voice alerts")
        print("   Perfect for Imagine Cup demonstrations!")
        
        for i, file in enumerate(voice_files[:3], 1):  # Play up to 3 files
            file_path = os.path.join(self.audio_dir, file)
            print(f"\n🎵 Playing alert {i}/{min(3, len(voice_files))}: {file}")
            
            if self.play_voice_alert(file_path):
                print("   ✅ Playback successful")
                time.sleep(2)  # Pause between alerts
            else:
                print("   ❌ Playback failed")
        
        print("\n🎉 Demo sequence complete!")
        return True

# Global instance
local_voice_player = LocalVoicePlayer()

def play_voice_alert_locally(audio_path: str, message: str = "") -> bool:
    """Global function to play voice alerts locally"""
    return local_voice_player.play_voice_alert(audio_path, message)

def play_latest_voice_alert() -> bool:
    """Global function to play the latest voice alert"""
    return local_voice_player.play_latest_voice_alert()