"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, 
  Play, 
  Square, 
  Trash2, 
  Copy, 
  Download,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: string;
  status: 'running' | 'completed' | 'error';
  type: 'kali' | 'system' | 'wireshark' | 'nmap' | 'custom';
}

interface KaliTerminalProps {
  className?: string;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function KaliTerminal({ className = "", fullscreen = false, onToggleFullscreen }: KaliTerminalProps) {
  const [commands, setCommands] = useState<TerminalCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isConnected, setIsConnected] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Predefined Kali commands with descriptions
  const kaliCommands = {
    // Wireshark commands
    'wireshark-start': {
      description: 'Start Wireshark packet capture',
      example: 'wireshark-start --interface en0 --duration 60',
      category: 'Network Analysis'
    },
    'wireshark-stop': {
      description: 'Stop current packet capture',
      example: 'wireshark-stop',
      category: 'Network Analysis'
    },
    'wireshark-analyze': {
      description: 'Analyze captured packets',
      example: 'wireshark-analyze --file latest',
      category: 'Network Analysis'
    },
    
    // Nmap commands
    'nmap-scan': {
      description: 'Network discovery scan',
      example: 'nmap-scan --target 192.168.1.0/24',
      category: 'Network Discovery'
    },
    'nmap-port': {
      description: 'Port scan specific host',
      example: 'nmap-port --host 192.168.1.100',
      category: 'Network Discovery'
    },
    
    // System commands
    'status': {
      description: 'Show security tools status',
      example: 'status',
      category: 'System'
    },
    'interfaces': {
      description: 'List network interfaces',
      example: 'interfaces',
      category: 'System'
    },
    'help': {
      description: 'Show available commands',
      example: 'help',
      category: 'System'
    },
    'clear': {
      description: 'Clear terminal screen',
      example: 'clear',
      category: 'System'
    }
  };

  useEffect(() => {
    // Add welcome message
    const welcomeCommand: TerminalCommand = {
      id: 'welcome',
      command: 'system-init',
      output: `
╔═══════════════════════════════════════════════════════════════╗
║                    SafeEdge Security Terminal                 ║
║                   Kali Linux Tools Integration                ║
╚═══════════════════════════════════════════════════════════════╝

Welcome to SafeEdge Security Terminal v1.0.0
Integrated with Kali Linux security tools

Type 'help' to see available commands
Type 'status' to check tools status

[INFO] Terminal initialized successfully
[INFO] Connected to SafeEdge backend
[INFO] Kali tools integration: ACTIVE
      `,
      timestamp: new Date().toISOString(),
      status: 'completed',
      type: 'system'
    };
    
    setCommands([welcomeCommand]);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new commands are added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    const commandId = `cmd_${Date.now()}`;
    const newCommand: TerminalCommand = {
      id: commandId,
      command: cmd,
      output: '',
      timestamp: new Date().toISOString(),
      status: 'running',
      type: 'custom'
    };

    setCommands(prev => [...prev, newCommand]);
    setTerminalHistory(prev => [...prev, cmd]);
    setCurrentCommand('');
    setIsRunning(true);

    try {
      let output = '';
      let status: 'completed' | 'error' = 'completed';
      let type: TerminalCommand['type'] = 'custom';

      // Parse command
      const [baseCmd, ...args] = cmd.trim().split(' ');
      
      switch (baseCmd.toLowerCase()) {
        case 'help':
          output = generateHelpOutput();
          type = 'system';
          break;
          
        case 'clear':
          setCommands([]);
          setIsRunning(false);
          return;
          
        case 'status':
          output = await getToolsStatus();
          type = 'system';
          break;
          
        case 'interfaces':
          output = await getNetworkInterfaces();
          type = 'system';
          break;
          
        case 'wireshark-start':
          output = await executeWiresharkStart(args);
          type = 'wireshark';
          break;
          
        case 'wireshark-stop':
          output = await executeWiresharkStop();
          type = 'wireshark';
          break;
          
        case 'wireshark-analyze':
          output = await executeWiresharkAnalyze(args);
          type = 'wireshark';
          break;
          
        case 'nmap-scan':
          output = await executeNmapScan(args);
          type = 'nmap';
          break;
          
        case 'nmap-port':
          output = await executeNmapPort(args);
          type = 'nmap';
          break;
          
        default:
          output = `Command not found: ${baseCmd}\nType 'help' to see available commands.`;
          status = 'error';
      }

      // Update command with output
      setCommands(prev => prev.map(c => 
        c.id === commandId 
          ? { ...c, output, status, type }
          : c
      ));

    } catch (error: any) {
      setCommands(prev => prev.map(c => 
        c.id === commandId 
          ? { ...c, output: `Error: ${error.message}`, status: 'error' }
          : c
      ));
    } finally {
      setIsRunning(false);
    }
  };

  const generateHelpOutput = () => {
    let output = `
Available Commands:
═══════════════════

NETWORK ANALYSIS:
  wireshark-start [--interface <if>] [--duration <sec>] [--filter <expr>]
                    Start packet capture
  wireshark-stop    Stop current capture
  wireshark-analyze [--file <name>]
                    Analyze captured packets

NETWORK DISCOVERY:
  nmap-scan --target <network>
                    Discover devices on network
  nmap-port --host <ip>
                    Scan ports on specific host

SYSTEM COMMANDS:
  status           Show security tools status
  interfaces       List network interfaces
  help             Show this help message
  clear            Clear terminal screen

EXAMPLES:
  wireshark-start --interface en0 --duration 60
  nmap-scan --target 192.168.1.0/24
  wireshark-analyze --file latest

For more information, visit the SafeEdge documentation.
    `;
    return output;
  };

  const getToolsStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/security-tools/system/tools-status');
      const data = await response.json();
      
      if (data.success) {
        let output = `
Security Tools Status:
═══════════════════════

`;
        Object.entries(data.tools).forEach(([tool, info]: [string, any]) => {
          const statusIcon = info.status === 'operational' ? '🟢' : 
                           info.status === 'not_implemented' ? '🟡' : '🔴';
          output += `${statusIcon} ${tool.toUpperCase()}: ${info.status}\n`;
          if (info.interface) output += `   Interface: ${info.interface}\n`;
          if (info.capturing !== undefined) output += `   Capturing: ${info.capturing ? 'Yes' : 'No'}\n`;
          if (info.message) output += `   Note: ${info.message}\n`;
          output += '\n';
        });
        
        output += `Summary: ${data.summary.available_tools}/${data.summary.total_tools} tools available\n`;
        return output;
      }
    } catch (error) {
      return `Error fetching tools status: ${error}`;
    }
    return 'Unable to fetch tools status';
  };

  const getNetworkInterfaces = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/security-tools/system/network-interfaces');
      const data = await response.json();
      
      if (data.success) {
        let output = `
Network Interfaces:
═══════════════════

`;
        data.interfaces.forEach((iface: any) => {
          const statusIcon = iface.status === 'active' ? '🟢' : '🔴';
          output += `${statusIcon} ${iface.name}\n`;
          output += `   IP: ${iface.ip || 'No IP assigned'}\n`;
          output += `   Status: ${iface.status}\n\n`;
        });
        
        output += `Current capture interface: ${data.current_interface}\n`;
        return output;
      }
    } catch (error) {
      return `Error fetching interfaces: ${error}`;
    }
    return 'Unable to fetch network interfaces';
  };

  const executeWiresharkStart = async (args: string[]) => {
    try {
      // Parse arguments
      const params: any = { duration: 60 };
      
      for (let i = 0; i < args.length; i += 2) {
        const flag = args[i];
        const value = args[i + 1];
        
        switch (flag) {
          case '--interface':
            params.interface = value;
            break;
          case '--duration':
            params.duration = parseInt(value);
            break;
          case '--filter':
            params.filter_expression = value;
            break;
        }
      }
      
      const response = await fetch('http://localhost:8000/api/security-tools/wireshark/start-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      const data = await response.json();
      
      if (data.success) {
        return `
Wireshark Packet Capture Started:
═══════════════════════════════════

✅ Capture started successfully
📡 Interface: ${data.interface}
⏱️  Duration: ${data.duration} seconds
🔍 Filter: ${data.filter || 'None'}
📁 File: ${data.capture_file?.split('/').pop() || 'N/A'}

Capture is now running in the background...
Use 'wireshark-stop' to stop early or 'status' to check progress.
        `;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      return `❌ Failed to start Wireshark capture: ${error.message}`;
    }
  };

  const executeWiresharkStop = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/security-tools/wireshark/stop-capture', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        return `
Wireshark Capture Stopped:
═══════════════════════════

✅ Capture stopped successfully
📁 File: ${data.capture_file?.split('/').pop() || 'N/A'}

Use 'wireshark-analyze --file latest' to analyze the captured data.
        `;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      return `❌ Failed to stop Wireshark capture: ${error.message}`;
    }
  };

  const executeWiresharkAnalyze = async (args: string[]) => {
    try {
      let endpoint = 'http://localhost:8000/api/security-tools/wireshark/analyze-latest';
      
      // Check if specific file requested
      const fileIndex = args.indexOf('--file');
      if (fileIndex !== -1 && args[fileIndex + 1] && args[fileIndex + 1] !== 'latest') {
        endpoint = `http://localhost:8000/api/security-tools/wireshark/analyze/${args[fileIndex + 1]}`;
      }
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        const analysis = data.analysis;
        let output = `
Wireshark Traffic Analysis Results:
═══════════════════════════════════════

📊 SUMMARY:
   Total Packets: ${analysis.total_packets.toLocaleString()}
   Protocols: ${Object.keys(analysis.protocols).length}
   IoT Devices: ${analysis.iot_devices.length}
   Anomalies: ${analysis.anomalies.length}
   Security Issues: ${analysis.security_issues.length}

`;

        if (analysis.iot_devices.length > 0) {
          output += `🔍 IOT DEVICES DETECTED:\n`;
          analysis.iot_devices.forEach((device: any) => {
            output += `   📱 ${device.ip} (${device.protocol}) - ${device.type}\n`;
          });
          output += '\n';
        }

        if (analysis.security_issues.length > 0) {
          output += `⚠️  SECURITY ISSUES:\n`;
          analysis.security_issues.forEach((issue: any) => {
            output += `   🚨 ${issue.type}: ${issue.description}\n`;
            if (issue.source_ip) output += `      Source: ${issue.source_ip}\n`;
          });
          output += '\n';
        }

        if (analysis.top_talkers.length > 0) {
          output += `📈 TOP NETWORK TALKERS:\n`;
          analysis.top_talkers.slice(0, 5).forEach((talker: any, index: number) => {
            output += `   ${index + 1}. ${talker.ip} - ${talker.packets.toLocaleString()} packets\n`;
          });
        }

        return output;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      return `❌ Failed to analyze capture: ${error.message}`;
    }
  };

  const executeNmapScan = async (args: string[]) => {
    const targetIndex = args.indexOf('--target');
    const target = targetIndex !== -1 ? args[targetIndex + 1] : '192.168.1.0/24';
    
    return `
Nmap Network Discovery:
═══════════════════════

🔍 Scanning network: ${target}

⚠️  Note: Nmap integration is not yet implemented.
This feature will be available in the next update.

For now, use Wireshark analysis to discover IoT devices:
  wireshark-start --duration 120
  wireshark-analyze --file latest
    `;
  };

  const executeNmapPort = async (args: string[]) => {
    const hostIndex = args.indexOf('--host');
    const host = hostIndex !== -1 ? args[hostIndex + 1] : 'localhost';
    
    return `
Nmap Port Scan:
═══════════════

🎯 Target host: ${host}

⚠️  Note: Nmap integration is not yet implemented.
This feature will be available in the next update.

For network analysis, use Wireshark tools instead.
    `;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRunning) {
      executeCommand(currentCommand);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < terminalHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(terminalHistory[terminalHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(terminalHistory[terminalHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  const clearTerminal = () => {
    setCommands([]);
  };

  const copyOutput = (output: string) => {
    navigator.clipboard.writeText(output);
    toast({
      title: 'Copied',
      description: 'Command output copied to clipboard',
    });
  };

  const getCommandTypeColor = (type: TerminalCommand['type']) => {
    switch (type) {
      case 'wireshark': return 'bg-[#6B8E6F] text-white';
      case 'nmap': return 'bg-[#5B6B8F] text-white';
      case 'system': return 'bg-[#242d53] text-white';
      case 'kali': return 'bg-[#C17A3A] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: TerminalCommand['status']) => {
    switch (status) {
      case 'running': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card className={`border-[#242d53]/20 shadow-lg ${className}`}>
      <CardHeader className="bg-gradient-to-r from-[#242d53] to-[#1a1f3a] text-white rounded-t-lg pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-[#d3b78f]" />
            <CardTitle className="text-lg">SafeEdge Security Terminal</CardTitle>
            <Badge className={isConnected ? 'bg-green-500' : 'bg-red-500'}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={clearTerminal}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {onToggleFullscreen && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={onToggleFullscreen}
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={terminalRef}
          className={`bg-black text-green-400 font-mono text-sm overflow-y-auto ${
            fullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'
          }`}
        >
          <div className="p-4 space-y-4">
            {commands.map((cmd) => (
              <div key={cmd.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#d3b78f]">safeedge@security:~$</span>
                  <span className="text-white">{cmd.command}</span>
                  <Badge className={getCommandTypeColor(cmd.type)} size="sm">
                    {cmd.type}
                  </Badge>
                  <span className={`text-xs ${getStatusColor(cmd.status)}`}>
                    {cmd.status === 'running' && '⏳'}
                    {cmd.status === 'completed' && '✅'}
                    {cmd.status === 'error' && '❌'}
                  </span>
                  {cmd.output && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                      onClick={() => copyOutput(cmd.output)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {cmd.output && (
                  <pre className="text-gray-300 whitespace-pre-wrap pl-4 border-l-2 border-[#242d53]">
                    {cmd.output}
                  </pre>
                )}
              </div>
            ))}
            
            {/* Command Input */}
            <div className="flex items-center gap-2">
              <span className="text-[#d3b78f]">safeedge@security:~$</span>
              <Input
                ref={inputRef}
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isRunning}
                className="bg-transparent border-none text-white font-mono focus:ring-0 focus:outline-none p-0"
                placeholder={isRunning ? "Command running..." : "Type command or 'help'"}
                autoFocus
              />
              {isRunning && (
                <div className="animate-spin text-yellow-400">⏳</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}