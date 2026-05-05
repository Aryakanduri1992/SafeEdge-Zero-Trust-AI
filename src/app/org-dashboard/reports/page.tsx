"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, TrendingUp, Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';
import { useToast } from '@/hooks/use-toast';

interface Report {
  id: string;
  title: string;
  type: string;
  description: string;
  fileUrl: string | null;
  generatedAt: string;
  status: string;
  metadata?: any;
}

interface MonthlyStats {
  month: string;
  totalDevices: number;
  activeDevices: number;
  alerts: number;
  securityScore: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      fetchReports(userData.organizationId);
      fetchMonthlyStats(userData.organizationId);
    }
  }, []);

  const fetchReports = async (organizationId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reports?organizationId=${organizationId}&limit=50`);
      const data = await response.json();

      if (response.ok) {
        setReports(data.reports || []);
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      // Don't show error toast, just log it
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyStats = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/reports/monthly-stats?organizationId=${organizationId}`);
      const data = await response.json();

      if (response.ok) {
        setMonthlyStats(data.stats || []);
      }
    } catch (error: any) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'device-usage':
        return <TrendingUp className="w-5 h-5 text-white" />;
      case 'monthly-summary':
        return <Calendar className="w-5 h-5 text-white" />;
      case 'security-audit':
        return <AlertCircle className="w-5 h-5 text-white" />;
      default:
        return <FileText className="w-5 h-5 text-white" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = (report: Report) => {
    if (report.fileUrl) {
      window.open(report.fileUrl, '_blank');
    } else {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Report file is not available',
      });
    }
  };

  const getMaxValue = () => {
    if (monthlyStats.length === 0) return 100;
    return Math.max(
      ...monthlyStats.map(s => Math.max(s.totalDevices, s.activeDevices, s.alerts))
    );
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Reports</h1>
              <p className="text-gray-200">Generate and view organization reports</p>
            </div>
            <Button className="bg-[#d3b78f] text-[#242d53] hover:bg-[#c9a876] font-semibold">
              <FileText className="w-4 h-4 mr-2" />
              Create Custom Report
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Monthly Statistics Graph */}
            {monthlyStats.length > 0 && (
              <Card className="bg-white border-2 border-[#d3b78f]/30">
                <CardHeader className="bg-gradient-to-br from-[#f8f9fa] to-white">
                  <CardTitle className="text-[#242d53] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#d3b78f]" />
                    Monthly Performance Overview
                  </CardTitle>
                  <CardDescription className="text-gray-600">Last 6 months statistics</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {monthlyStats.map((stat, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-[#242d53]">{stat.month}</span>
                          <div className="flex gap-4 text-xs">
                            <span className="text-gray-600">Devices: <span className="font-bold text-[#242d53]">{stat.totalDevices}</span></span>
                            <span className="text-gray-600">Active: <span className="font-bold text-[#6B8E6F]">{stat.activeDevices}</span></span>
                            <span className="text-gray-600">Alerts: <span className="font-bold text-[#C17A3A]">{stat.alerts}</span></span>
                            <span className="text-gray-600">Score: <span className="font-bold text-[#d3b78f]">{stat.securityScore}%</span></span>
                          </div>
                        </div>
                        <div className="flex gap-1 h-8">
                          <div 
                            className="bg-[#242d53] rounded flex items-center justify-center text-white text-xs font-bold transition-all hover:opacity-80"
                            style={{ width: `${(stat.totalDevices / getMaxValue()) * 100}%` }}
                            title={`Total Devices: ${stat.totalDevices}`}
                          >
                            {stat.totalDevices > 0 && stat.totalDevices}
                          </div>
                          <div 
                            className="bg-[#6B8E6F] rounded flex items-center justify-center text-white text-xs font-bold transition-all hover:opacity-80"
                            style={{ width: `${(stat.activeDevices / getMaxValue()) * 100}%` }}
                            title={`Active Devices: ${stat.activeDevices}`}
                          >
                            {stat.activeDevices > 0 && stat.activeDevices}
                          </div>
                          <div 
                            className="bg-[#C17A3A] rounded flex items-center justify-center text-white text-xs font-bold transition-all hover:opacity-80"
                            style={{ width: `${(stat.alerts / getMaxValue()) * 100}%` }}
                            title={`Alerts: ${stat.alerts}`}
                          >
                            {stat.alerts > 0 && stat.alerts}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#242d53] rounded"></div>
                      <span className="text-gray-600">Total Devices</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#6B8E6F] rounded"></div>
                      <span className="text-gray-600">Active Devices</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#C17A3A] rounded"></div>
                      <span className="text-gray-600">Alerts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reports List */}
            {reports.length > 0 ? (
              <Card className="bg-gradient-to-br from-[#242d53] to-[#2d3a5f] border-[#d3b78f]/20">
                <CardHeader>
                  <CardTitle className="text-white">Available Reports</CardTitle>
                  <CardDescription className="text-gray-300">Generated reports for your organization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-[#d3b78f]/30">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#d3b78f] rounded-lg flex items-center justify-center">
                            {getReportIcon(report.type)}
                          </div>
                          <div>
                            <h4 className="font-bold text-[#242d53]">{report.title}</h4>
                            <p className="text-sm text-gray-600">{report.description}</p>
                            <p className="text-xs text-gray-500 mt-1">Generated on {formatDate(report.generatedAt)}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-[#d3b78f] text-[#242d53] hover:bg-[#c9a876] font-medium"
                          onClick={() => handleDownload(report)}
                          disabled={!report.fileUrl}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-[#242d53]/10">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-[#d3b78f]" />
                    <p className="text-[#242d53] mb-2 font-semibold">No reports available</p>
                    <p className="text-sm text-[#5B6B8F] mb-4">Reports will appear here once generated</p>
                    <Button className="bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90 border-2 border-transparent hover:border-[#d3b78f]">
                      <FileText className="w-4 h-4 mr-2" />
                      Create Your First Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </LayoutWrapper>
  );
}
