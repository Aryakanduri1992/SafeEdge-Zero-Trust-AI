"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, 
  Play, 
  Square, 
  Download, 
  RefreshCw, 
  Wifi, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Eye,
  BarChart3,
  Network,
  Loader2,
  FileText,
  Settings
} from 'lucide-react';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';
import { useToast } from '@/hooks/use-toast';

interface CaptureStatus {
  is_capturing: boolean;
  interface: string;
  current_file: string | null;
  capture_directory: string;
}

interface CaptureFile {
  filename: string;
  filepath: string;
  size: number;
  created: string;
  modified: string;
}

interface TrafficAnalysis {
  success: boolean;
  file: string;
  analysis: {
    total_packets: number;
    protocols: { [key: string]: number };
    top_talkers: Array<{
      ip: string;
      packets: number;
      bytes: number;
    }>;
    iot_devices: Array<{
      ip: string;
      protocol: string;
      type: string;
    }>;
    anomalies: Array<{
      type: string;
      severity: string;
      [key: string]: any;
    }>;
    security_issues: Array<{
      type: string;
      severity: string;
      description: string;
      [key: string]: any;
    }>;
  };
}

interface NetworkInterface {
  name: string;
  status: string;
  ip: string | null;
}

export default function NetworkAnalysisPage() {
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus | null>(null);
  const [captureFiles, setCaptureFiles] = useState<CaptureFile[]>([]);
  const [networkInterfaces, setNetworkInterfaces] = useState<NetworkInterface[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<TrafficAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captureDuration, setCaptureDuration] = useState(60);
  const [filterExpression, setFilterExpression] = useState('');
  const [selectedInterface, setSelectedInterface] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCaptureStatus();
    fetchCaptureFiles();
    fetchNetworkInterfaces();
    
    // Set up auto-refresh for capture status
    const interval = setInterval(() => {
      if (captureStatus?.is_capturing) {
        fetchCaptureStatus();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [captureStatus?.is_capturing]);

  const fetchCaptureStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/security-tools/wireshark/status');
      const data = await response.json();
      setCaptureStatus(data);
    } catch (error) {
      console.error('Error fetching capture status:', error);
    }
  };

  const fetchCaptureFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/security-tools/wireshark/captures');
      const data = await response.json();
      if (data.success) {
        setCaptureFiles(data.captures);
      }
    } catch (error) {
      console.error('Error fetching capture files:', error);
    }
  };

  const fetchNetworkInterfaces = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/security-tools/system/network-interfaces');
      const data = await response.json();
      if (data.success) {
        setNetworkInterfaces(data.interfaces);
        if (!selectedInterface && data.current_interface) {
          setSelectedInterface(data.current_interface);
        }
      }
    } catch (error) {
      console.error('Error fetching network interfaces:', error);
    }
  };

  const startCapture = async () => {
    try {
      setIsLoading(true);
      
      const requestBody: any = {
        duration: captureDuration
      };
      
      if (filterExpression) {
        requestBody.filter_expression = filterExpression;
      }
      
      if (selectedInterface) {
        requestBody.interface = selectedInterface;
      }
      
      const response = await fetch('http://localhost:8000/api/security-tools/wireshark/start-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Packet Capture Started',
          description: `Capturing on ${data.interface} for ${data.duration} seconds`,
        });
        fetchCaptureStatus();
      } else {
        throw new Error(data.error || 'Failed to start capture');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Capture Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopCapture = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:8000/api/security-tools/wireshark/stop-capture', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Capture Stopped',
          description: 'Packet capture stopped successfully',
        });
        fetchCaptureStatus();
        fetchCaptureFiles();
      } else {
        throw new Error(data.error || 'Failed to stop capture');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Stop Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeCapture = async (filename: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`http://localhost:8000/api/security-tools/wireshark/analyze/${filename}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentAnalysis(data);
        toast({
          title: 'Analysis Complete',
          description: `Analyzed ${data.analysis.total_packets} packets`,
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeLatest = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:8000/api/security-tools/wireshark/analyze-latest');
      const data = await response.json();
      
      if (data.success) {
        setCurrentAnalysis(data);
        toast({
          title: 'Analysis Complete',
          description: `Analyzed ${data.analysis.total_packets} packets from latest capture`,
        });
      } else {
        throw new Error(data.error || 'No capture file available for analysis');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Network className="w-8 h-8 text-[#d3b78f]" />
                <h1 className="text-3xl font-bold">Network Analysis</h1>
              </div>
              <p className="text-gray-200">Real-time packet capture and traffic analysis with Wireshark</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="bg-white/10 border-[#d3b78f] text-white hover:bg-[#d3b78f] hover:text-[#242d53]"
                onClick={fetchCaptureFiles}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Capture Control Panel */}
        <Card className="border-[#242d53]/10 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Packet Capture Control
            </CardTitle>
            <CardDescription className="text-gray-200">
              Configure and control Wireshark packet capture
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Capture Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-[#242d53]">Capture Settings</h3>
                
                <div>
                  <label className="block text-sm font-medium text-[#5B6B8F] mb-2">
                    Network Interface
                  </label>
                  <Select value={selectedInterface} onValueChange={setSelectedInterface}>
                    <SelectTrigger className="border-[#242d53]/20">
                      <SelectValue placeholder="Select interface" />
                    </SelectTrigger>
                    <SelectContent>
                      {networkInterfaces.map((iface) => (
                        <SelectItem key={iface.name} value={iface.name}>
                          {iface.name} ({iface.ip || 'No IP'}) - {iface.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5B6B8F] mb-2">
                    Duration (seconds)
                  </label>
                  <Input
                    type="number"
                    value={captureDuration}
                    onChange={(e) => setCaptureDuration(parseInt(e.target.value))}
                    className="border-[#242d53]/20"
                    min="10"
                    max="3600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5B6B8F] mb-2">
                    Filter Expression (optional)
                  </label>
                  <Input
                    value={filterExpression}
                    onChange={(e) => setFilterExpression(e.target.value)}
                    placeholder="e.g., tcp port 80, host 192.168.1.1"
                    className="border-[#242d53]/20"
                  />
                  <p className="text-xs text-[#5B6B8F] mt-1">
                    Use Wireshark display filter syntax
                  </p>
                </div>
              </div>

              {/* Capture Status */}
              <div className="space-y-4">
                <h3 className="font-semibold text-[#242d53]">Capture Status</h3>
                
                {captureStatus && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${captureStatus.is_capturing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <span className="font-medium">
                        {captureStatus.is_capturing ? 'Capturing' : 'Idle'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-[#5B6B8F] space-y-1">
                      <div>Interface: {captureStatus.interface}</div>
                      {captureStatus.current_file && (
                        <div>Current file: {captureStatus.current_file.split('/').pop()}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={startCapture}
                    disabled={isLoading || captureStatus?.is_capturing}
                    className="bg-[#6B8E6F] hover:bg-[#5a7a5e] text-white"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Start Capture
                  </Button>
                  
                  <Button
                    onClick={stopCapture}
                    disabled={isLoading || !captureStatus?.is_capturing}
                    variant="outline"
                    className="border-[#8B2635] text-[#8B2635] hover:bg-[#8B2635] hover:text-white"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Capture
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capture Files */}
        <Card className="border-[#242d53]/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#242d53]">Capture Files</CardTitle>
            <CardDescription>Available packet capture files for analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {captureFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-[#d3b78f]" />
                <p className="text-[#242d53] mb-2 font-semibold">No capture files found</p>
                <p className="text-sm text-[#5B6B8F]">Start a packet capture to begin analysis</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#242d53]/5">
                    <TableHead className="text-[#242d53]">Filename</TableHead>
                    <TableHead className="text-[#242d53]">Size</TableHead>
                    <TableHead className="text-[#242d53]">Created</TableHead>
                    <TableHead className="text-[#242d53]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {captureFiles.map((file) => (
                    <TableRow key={file.filename} className="hover:bg-[#d3b78f]/10">
                      <TableCell>
                        <div className="font-medium text-[#242d53]">{file.filename}</div>
                      </TableCell>
                      <TableCell className="text-[#5B6B8F]">
                        {formatBytes(file.size)}
                      </TableCell>
                      <TableCell className="text-[#5B6B8F]">
                        {formatDate(file.created)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => analyzeCapture(file.filename)}
                            disabled={isLoading}
                            className="bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Analyze
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {captureFiles.length > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <Button
                  onClick={analyzeLatest}
                  disabled={isLoading}
                  className="bg-[#d3b78f] text-[#242d53] hover:bg-[#c9a876]"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Latest Capture
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {currentAnalysis && (
          <div className="space-y-6">
            {/* Analysis Summary */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Total Packets</CardTitle>
                  <Activity className="h-5 w-5 text-[#d3b78f]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">
                    {currentAnalysis.analysis.total_packets.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Protocols</CardTitle>
                  <Network className="h-5 w-5 text-[#d3b78f]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">
                    {Object.keys(currentAnalysis.analysis.protocols).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">IoT Devices</CardTitle>
                  <Wifi className="h-5 w-5 text-[#6B8E6F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">
                    {currentAnalysis.analysis.iot_devices.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Security Issues</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-[#C17A3A]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">
                    {currentAnalysis.analysis.security_issues.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Issues */}
            {currentAnalysis.analysis.security_issues.length > 0 && (
              <Card className="border-[#242d53]/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#242d53] flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#C17A3A]" />
                    Security Issues Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentAnalysis.analysis.security_issues.map((issue, index) => (
                      <div key={index} className="border-l-4 border-[#C17A3A] bg-[#C17A3A]/5 p-4 rounded-r-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getSeverityColor(issue.severity)}>
                                {issue.severity.toUpperCase()}
                              </Badge>
                              <span className="font-medium text-[#242d53]">{issue.type}</span>
                            </div>
                            <p className="text-sm text-[#5B6B8F]">{issue.description}</p>
                            {issue.source_ip && (
                              <p className="text-xs text-[#5B6B8F] mt-1">Source: {issue.source_ip}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* IoT Devices */}
            {currentAnalysis.analysis.iot_devices.length > 0 && (
              <Card className="border-[#242d53]/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#242d53]">Detected IoT Devices</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#242d53]/5">
                        <TableHead className="text-[#242d53]">IP Address</TableHead>
                        <TableHead className="text-[#242d53]">Protocol</TableHead>
                        <TableHead className="text-[#242d53]">Device Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentAnalysis.analysis.iot_devices.map((device, index) => (
                        <TableRow key={index} className="hover:bg-[#d3b78f]/10">
                          <TableCell className="font-medium text-[#242d53]">{device.ip}</TableCell>
                          <TableCell className="text-[#5B6B8F]">{device.protocol}</TableCell>
                          <TableCell>
                            <Badge className="bg-[#6B8E6F] text-white">
                              {device.type}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Top Talkers */}
            {currentAnalysis.analysis.top_talkers.length > 0 && (
              <Card className="border-[#242d53]/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#242d53]">Top Network Talkers</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#242d53]/5">
                        <TableHead className="text-[#242d53]">IP Address</TableHead>
                        <TableHead className="text-[#242d53]">Packets</TableHead>
                        <TableHead className="text-[#242d53]">Bytes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentAnalysis.analysis.top_talkers.map((talker, index) => (
                        <TableRow key={index} className="hover:bg-[#d3b78f]/10">
                          <TableCell className="font-medium text-[#242d53]">{talker.ip}</TableCell>
                          <TableCell className="text-[#5B6B8F]">{talker.packets.toLocaleString()}</TableCell>
                          <TableCell className="text-[#5B6B8F]">{formatBytes(talker.bytes)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}