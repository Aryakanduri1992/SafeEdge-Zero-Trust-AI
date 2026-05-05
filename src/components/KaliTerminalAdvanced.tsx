"use client";

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Terminal as TerminalIcon, 
  Maximize2, 
  Minimize2, 
  Settings, 
  Wifi, 
  WifiOff,
  Power,
  RefreshCw,
  Shield,
  Copy,
  Download,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import '@xterm/xterm/css/xterm.css';

interface KaliTerminalAdvancedProps {
  className?: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function KaliTerminalAdvanced({ 
  className = "", 
  onConnectionChange 
}: KaliTerminalAdvancedProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const websocket = useRef<WebSocket | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [kaliVmHost, setKaliVmHost] = useState('');
  const [kaliPort, setKaliPort] = useState('22');
  const [kaliUsername, setKaliUsername] = useState('safeedge');
  const [kaliPassword, setKaliPassword] = useState('kali');
  const [terminalInitialized, setTerminalInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const openTerminal = () => {
    if (!terminalInitialized && terminalRef.current) {
      initializeTerminal();
      setTerminalInitialized(true);
    }
    setShowConnectionDialog(true);
  };

  const handleConnect = () => {
    if (!kaliVmHost.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid IP Address',
        description: 'Please enter a valid Kali VM IP address',
      });
      return;
    }

    setShowConnectionDialog(false);
    connectToKali();
  };

  const initializeTerminal = () => {
    if (!terminalRef.current) return;

    // Create terminal instance with Kali Linux theme
    terminal.current = new Terminal({
      theme: {
        background: '#0a0a0a',
        foreground: '#00ff00',
        cursor: '#00ff00',
        cursorAccent: '#00ff00',
        selection: 'rgba(0, 255, 0, 0.3)',
        black: '#000000',
        red: '#ff0000',
        green: '#00ff00',
        yellow: '#ffff00',
        blue: '#0000ff',
        magenta: '#ff00ff',
        cyan: '#00ffff',
        white: '#ffffff',
        brightBlack: '#808080',
        brightRed: '#ff8080',
        brightGreen: '#80ff80',
        brightYellow: '#ffff80',
        brightBlue: '#8080ff',
        brightMagenta: '#ff80ff',
        brightCyan: '#80ffff',
        brightWhite: '#ffffff'
      },
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Courier New", monospace',
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      tabStopWidth: 4,
      allowProposedApi: true
    });

    // Add addons
    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.loadAddon(new WebLinksAddon());
    terminal.current.loadAddon(new SearchAddon());

    // Open terminal
    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();

    // Show Kali Linux welcome message
    showKaliWelcome();

    // Handle terminal input
    terminal.current.onData((data) => {
      if (isConnected && websocket.current?.readyState === WebSocket.OPEN) {
        // Send to Kali VM
        websocket.current.send(data);
      } else {
        // Handle local commands
        handleLocalInput(data);
      }
    });

    // Handle resize
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const showKaliWelcome = () => {
    if (!terminal.current) return;

    const kaliAscii = `
\\x1b[32m
     ██╗  ██╗ █████╗ ██╗     ██╗    ██╗     ██╗███╗   ██╗██╗   ██╗██╗  ██╗
     ██║ ██╔╝██╔══██╗██║     ██║    ██║     ██║████╗  ██║██║   ██║╚██╗██╔╝
     █████╔╝ ███████║██║     ██║    ██║     ██║██╔██╗ ██║██║   ██║ ╚███╔╝ 
     ██╔═██╗ ██╔══██║██║     ██║    ██║     ██║██║╚██╗██║██║   ██║ ██╔██╗ 
     ██║  ██╗██║  ██║███████╗██║    ███████╗██║██║ ╚████║╚██████╔╝██╔╝ ██╗
     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝    ╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝
\\x1b[0m

\\x1b[33m╔═══════════════════════════════════════════════════════════════════════╗\\x1b[0m
\\x1b[33m║\\x1b[0m                    \\x1b[1;31mSafeEdge Kali Linux Terminal\\x1b[0m                   \\x1b[33m║\\x1b[0m
\\x1b[33m║\\x1b[0m                   \\x1b[36mProfessional Security Testing\\x1b[0m                   \\x1b[33m║\\x1b[0m
\\x1b[33m╚═══════════════════════════════════════════════════════════════════════╝\\x1b[0m

\\x1b[32m[INFO]\\x1b[0m SafeEdge Kali Terminal v2.0.0 - Enterprise Security Platform
\\x1b[32m[INFO]\\x1b[0m Session ID: ${sessionId}

\\x1b[36mAvailable Commands:\\x1b[0m
  \\x1b[32mconnect\\x1b[0m     - Connect to Kali Linux VM
  \\x1b[32mhelp\\x1b[0m        - Show available commands and tools
  \\x1b[32mstatus\\x1b[0m      - Show connection and system status
  \\x1b[32mtools\\x1b[0m       - List available security tools
  \\x1b[32mclear\\x1b[0m       - Clear terminal screen

\\x1b[31m⚠️  SECURITY NOTICE:\\x1b[0m
\\x1b[31m   • Only use on authorized systems and networks\\x1b[0m
\\x1b[31m   • All commands are logged for security audit\\x1b[0m
\\x1b[31m   • Follow responsible disclosure practices\\x1b[0m
\\x1b[31m   • Ensure proper authorization before testing\\x1b[0m

\\x1b[33mClick 'Connect' button to establish connection to Kali VM...\\x1b[0m

`;

    terminal.current.write(kaliAscii);
    terminal.current.write('\\r\\n\\x1b[32msafeedge@security\\x1b[0m:\\x1b[34m~\\x1b[0m$ ');
  };

  const connectToKali = async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    
    if (terminal.current) {
      terminal.current.write('\\x1b[33m[CONNECTING]\\x1b[0m Establishing connection to Kali VM...\\r\\n');
      terminal.current.write('\\x1b[33m[INFO]\\x1b[0m Target: ' + kaliVmHost + ':' + kaliPort + '\\r\\n');
      terminal.current.write('\\x1b[33m[INFO]\\x1b[0m Username: ' + kaliUsername + '\\r\\n');
      terminal.current.write('\\x1b[33m[INFO]\\x1b[0m Initializing SSH tunnel...\\r\\n');
    }

    try {
      // Create WebSocket connection to backend with connection parameters
      const connectionParams = {
        host: kaliVmHost,
        port: kaliPort,
        username: kaliUsername,
        password: kaliPassword
      };
      
      const wsUrl = `ws://localhost:8000/ws/kali-terminal/${sessionId}?` + 
        new URLSearchParams(connectionParams).toString();
      websocket.current = new WebSocket(wsUrl);

      websocket.current.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        onConnectionChange?.(true);
        
        toast({
          title: 'Connected to Kali VM',
          description: `SSH session established to ${kaliVmHost}`,
        });
      };

      websocket.current.onmessage = (event) => {
        if (terminal.current) {
          terminal.current.write(event.data);
        }
      };

      websocket.current.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        onConnectionChange?.(false);
        
        if (terminal.current) {
          terminal.current.write('\\r\\n\\x1b[31m[DISCONNECTED]\\x1b[0m Connection to Kali VM lost\\r\\n');
          terminal.current.write('\\x1b[33m[INFO]\\x1b[0m Click Connect button to reconnect\\x1b[0m\\r\\n');
          terminal.current.write('\\x1b[32msafeedge@security\\x1b[0m:\\x1b[34m~\\x1b[0m$ ');
        }
        
        toast({
          variant: 'destructive',
          title: 'Disconnected from Kali VM',
          description: 'SSH session terminated',
        });
      };

      websocket.current.onerror = (error) => {
        setIsConnecting(false);
        console.error('WebSocket error:', error);
        
        if (terminal.current) {
          terminal.current.write('\\r\\n\\x1b[31m[ERROR]\\x1b[0m Failed to connect to Kali VM\\r\\n');
          terminal.current.write('\\x1b[31m[ERROR]\\x1b[0m Please check:\\r\\n');
          terminal.current.write('\\x1b[31m  • Kali VM is running and accessible\\x1b[0m\\r\\n');
          terminal.current.write('\\x1b[31m  • SSH service is enabled on Kali VM\\x1b[0m\\r\\n');
          terminal.current.write('\\x1b[31m  • Network connectivity is available\\x1b[0m\\r\\n');
          terminal.current.write('\\x1b[31m  • Backend WebSocket server is running\\x1b[0m\\r\\n');
          terminal.current.write('\\x1b[32msafeedge@security\\x1b[0m:\\x1b[34m~\\x1b[0m$ ');
        }
        
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: `Unable to connect to ${kaliVmHost}. Check VM status and network.`,
        });
      };

    } catch (error) {
      setIsConnecting(false);
      console.error('Connection error:', error);
    }
  };

  const disconnectFromKali = () => {
    if (websocket.current) {
      websocket.current.close();
    }
    setIsConnected(false);
    setIsConnecting(false);
    onConnectionChange?.(false);
    
    if (terminal.current) {
      terminal.current.write('\\x1b[33m[INFO]\\x1b[0m Disconnected from Kali VM\\r\\n');
    }
  };

  const handleLocalInput = (data: string) => {
    if (!terminal.current) return;

    if (data === '\\r') {
      terminal.current.write('\\r\\n');
      const command = currentInput.trim();
      if (command) {
        setCommandHistory(prev => [...prev, command]);
        executeLocalCommand(command);
      }
      setCurrentInput('');
      setHistoryIndex(-1);
    } else if (data === '\\u007f') {
      if (currentInput.length > 0) {
        setCurrentInput(prev => prev.slice(0, -1));
        terminal.current.write('\\b \\b');
      }
    } else if (data >= ' ' && data <= '~') {
      setCurrentInput(prev => prev + data);
      terminal.current.write(data);
    }
  };

  const executeLocalCommand = (command: string) => {
    if (!terminal.current) return;

    switch (command.toLowerCase()) {
      case 'help':
        showHelp();
        break;
      case 'status':
        showStatus();
        break;
      case 'tools':
        showTools();
        break;
      case 'clear':
        terminal.current.clear();
        showKaliWelcome();
        return;
      case 'connect':
        setShowConnectionDialog(true);
        break;
      default:
        if (command) {
          terminal.current.write(`\\x1b[31mCommand not found:\\x1b[0m ${command}\\r\\n`);
          terminal.current.write('Type \\x1b[32mhelp\\x1b[0m for available commands or click \\x1b[32mConnect\\x1b[0m button\\r\\n');
        }
    }
    
    terminal.current.write('\\x1b[32msafeedge@security\\x1b[0m:\\x1b[34m~\\x1b[0m$ ');
  };

  const showHelp = () => {
    if (!terminal.current) return;

    const helpText = `
\\x1b[36mSafeEdge Kali Terminal - Command Reference:\\x1b[0m

\\x1b[33mConnection Commands:\\x1b[0m
  \\x1b[32mconnect\\x1b[0m     - Open connection dialog
  \\x1b[32mstatus\\x1b[0m      - Show connection status

\\x1b[33mLocal Commands:\\x1b[0m
  \\x1b[32mhelp\\x1b[0m        - Show this help message
  \\x1b[32mtools\\x1b[0m       - List available security tools
  \\x1b[32mclear\\x1b[0m       - Clear terminal screen

\\x1b[33mKali Security Tools (when connected):\\x1b[0m
  \\x1b[32mnmap\\x1b[0m        - Network discovery and port scanning
  \\x1b[32mnikto\\x1b[0m       - Web vulnerability scanner
  \\x1b[32msqlmap\\x1b[0m      - SQL injection testing tool
  \\x1b[32mmetasploit\\x1b[0m  - Penetration testing framework
  \\x1b[32mjohn\\x1b[0m        - Password cracking tool
  \\x1b[32mhashcat\\x1b[0m     - Advanced password recovery

\\x1b[31m⚠️  Security Reminders:\\x1b[0m
\\x1b[31m   • Only test systems you own or have permission to test\\x1b[0m
\\x1b[31m   • Follow responsible disclosure practices\\x1b[0m
\\x1b[31m   • All activities are logged for security audit\\x1b[0m

`;
    terminal.current.write(helpText);
  };

  const showStatus = () => {
    if (!terminal.current) return;

    const statusText = `
\\x1b[36mSystem Status Report:\\x1b[0m

\\x1b[33mConnection Information:\\x1b[0m
  Target VM: ${kaliVmHost || 'Not configured'}
  Status: ${isConnected ? '\\x1b[32mConnected ✓\\x1b[0m' : isConnecting ? '\\x1b[33mConnecting...\\x1b[0m' : '\\x1b[31mDisconnected ✗\\x1b[0m'}
  Session ID: ${sessionId}

\\x1b[33mTerminal Information:\\x1b[0m
  Rows: ${terminal.current?.rows || 'N/A'}
  Cols: ${terminal.current?.cols || 'N/A'}
  Theme: Kali Linux (Green on Black)

`;
    terminal.current.write(statusText);
  };

  const showTools = () => {
    if (!terminal.current) return;

    const toolsText = `
\\x1b[36mAvailable Security Tools:\\x1b[0m

\\x1b[33m🔍 Network Analysis:\\x1b[0m
  \\x1b[32mnmap\\x1b[0m         - Network discovery, port scanning
  \\x1b[32mmasscan\\x1b[0m      - High-speed port scanner
  \\x1b[32mnetdiscover\\x1b[0m  - ARP reconnaissance tool

\\x1b[33m🌐 Web Application Testing:\\x1b[0m
  \\x1b[32mnikto\\x1b[0m        - Web vulnerability scanner
  \\x1b[32mgobuster\\x1b[0m     - Directory/file brute-forcer
  \\x1b[32msqlmap\\x1b[0m       - SQL injection testing

\\x1b[33m🔓 Password Attacks:\\x1b[0m
  \\x1b[32mjohn\\x1b[0m         - Password cracking tool
  \\x1b[32mhashcat\\x1b[0m      - Advanced password recovery
  \\x1b[32mhydra\\x1b[0m        - Network login cracker

\\x1b[33m🎯 Exploitation:\\x1b[0m
  \\x1b[32mmetasploit\\x1b[0m   - Penetration testing framework
  \\x1b[32msearchsploit\\x1b[0m - Exploit database search

\\x1b[32mTo use these tools, click the Connect button to access Kali VM.\\x1b[0m

`;
    terminal.current.write(toolsText);
  };

  const cleanup = () => {
    if (websocket.current) {
      websocket.current.close();
    }
    if (terminal.current) {
      terminal.current.dispose();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    }, 100);
  };

  const clearTerminal = () => {
    if (terminal.current) {
      terminal.current.clear();
      showKaliWelcome();
    }
  };

  const copyTerminalContent = () => {
    if (terminal.current) {
      const content = terminal.current.getSelection();
      if (content) {
        navigator.clipboard.writeText(content);
        toast({
          title: 'Copied',
          description: 'Terminal content copied to clipboard',
        });
      }
    }
  };

  return (
    <>
      {/* Connection Dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <TerminalIcon className="w-5 h-5 text-green-500" />
              Connect to Kali Linux VM
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Enter the connection details for your Kali Linux virtual machine.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kali-host" className="text-right text-white font-medium">
                IP Address
              </Label>
              <Input
                id="kali-host"
                value={kaliVmHost}
                onChange={(e) => setKaliVmHost(e.target.value)}
                placeholder="192.168.1.100"
                className="col-span-3 bg-gray-800 text-white border-gray-600 focus:border-green-500 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kali-port" className="text-right text-white font-medium">
                Port
              </Label>
              <Input
                id="kali-port"
                value={kaliPort}
                onChange={(e) => setKaliPort(e.target.value)}
                placeholder="22"
                className="col-span-3 bg-gray-800 text-white border-gray-600 focus:border-green-500 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kali-username" className="text-right text-white font-medium">
                Username
              </Label>
              <Input
                id="kali-username"
                value={kaliUsername}
                onChange={(e) => setKaliUsername(e.target.value)}
                placeholder="safeedge"
                className="col-span-3 bg-gray-800 text-white border-gray-600 focus:border-green-500 placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kali-password" className="text-right text-white font-medium">
                Password
              </Label>
              <Input
                id="kali-password"
                type="password"
                value={kaliPassword}
                onChange={(e) => setKaliPassword(e.target.value)}
                placeholder="kali"
                className="col-span-3 bg-gray-800 text-white border-gray-600 focus:border-green-500 placeholder:text-gray-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectionDialog(false)} className="text-white border-gray-600 hover:bg-gray-800">
              Cancel
            </Button>
            <Button onClick={handleConnect} className="bg-green-600 hover:bg-green-700 text-white">
              <Power className="w-4 h-4 mr-2" />
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminal Interface */}
      {!terminalInitialized ? (
        <Card className={`border-[#242d53]/20 shadow-lg ${className}`}>
          <CardHeader className="bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] text-green-400 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TerminalIcon className="w-6 h-6 text-green-400" />
                <CardTitle className="text-lg font-mono">Kali Linux Terminal</CardTitle>
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Ready to Connect
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                <TerminalIcon className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#242d53] mb-2">
                  Professional Security Testing Terminal
                </h3>
                <p className="text-[#5B6B8F] mb-4">
                  Connect to your Kali Linux VM to access enterprise-grade security tools including 
                  Nmap, Nikto, SQLMap, Metasploit, and more.
                </p>
              </div>
              <Button 
                onClick={openTerminal}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
              >
                <TerminalIcon className="w-5 h-5 mr-2" />
                Open Terminal
              </Button>
              <div className="text-xs text-[#5B6B8F] mt-4">
                <p>⚠️ Only use on authorized systems and networks</p>
                <p>🔒 All activities are logged for security audit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={`border-[#242d53]/20 shadow-lg ${isFullscreen ? 'fixed inset-4 z-50' : className}`}>
          <CardHeader className="bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] text-green-400 rounded-t-lg pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TerminalIcon className="w-6 h-6 text-green-400" />
                <CardTitle className="text-lg font-mono">Kali Linux Terminal</CardTitle>
                <Badge className={isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'}>
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : isConnecting ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 mr-1" />
                      Disconnected
                    </>
                  )}
                </Badge>
                {kaliVmHost && (
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {kaliVmHost}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {!isConnected && !isConnecting && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-green-400 hover:bg-green-400/10"
                    onClick={() => setShowConnectionDialog(true)}
                  >
                    <Power className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                )}
                {isConnected && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:bg-red-400/10"
                    onClick={disconnectFromKali}
                  >
                    <Power className="w-4 h-4 mr-1" />
                    Disconnect
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-400 hover:bg-green-400/10"
                  onClick={copyTerminalContent}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-400 hover:bg-green-400/10"
                  onClick={clearTerminal}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-400 hover:bg-green-400/10"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              ref={terminalRef}
              className={`bg-black ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-96'}`}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}