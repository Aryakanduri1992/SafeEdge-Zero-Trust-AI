"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Cpu, TrendingUp, Loader2, Mail, User, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';

interface OrgData {
  departments: any[];
  statistics: {
    totalDepartments: number;
  };
}

export default function DepartmentsPage() {
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      fetchOrgData(userData.organizationId);
    }
  }, []);

  const fetchOrgData = async (organizationId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/org-data?organizationId=${organizationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setOrgData(data);
    } catch (error: any) {
      console.error('Error fetching org data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load department data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalEmployees = () => {
    // Mock data - in real app, this would come from database
    return orgData?.departments.length ? orgData.departments.length * 35 : 0;
  };

  const getTotalDevices = () => {
    if (!orgData) return 0;
    return orgData.departments.reduce((sum, dept) => sum + (dept.maxDevices || 0), 0);
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Departments</h1>
              <p className="text-gray-200">Manage your organization's departments</p>
            </div>
            <Button className="bg-[#d3b78f] text-[#242d53] hover:bg-[#c9a876] font-semibold">
              <Building2 className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Total Departments</CardTitle>
                  <Building2 className="h-5 w-5 text-[#d3b78f]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{orgData?.statistics.totalDepartments || 0}</div>
                  <p className="text-xs text-[#6B8E6F] flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Active departments
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Total Employees</CardTitle>
                  <Users className="h-5 w-5 text-[#d3b78f]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{getTotalEmployees()}</div>
                  <p className="text-xs text-[#5B6B8F] mt-1">Across all departments</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Total Devices</CardTitle>
                  <Cpu className="h-5 w-5 text-[#6B8E6F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">{getTotalDevices()}</div>
                  <p className="text-xs text-[#5B6B8F] mt-1">Device capacity</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-[#242d53]/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Avg Utilization</CardTitle>
                  <TrendingUp className="h-5 w-5 text-[#C17A3A]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#242d53]">78%</div>
                  <p className="text-xs text-[#5B6B8F] mt-1">Resource usage</p>
                </CardContent>
              </Card>
            </div>

            {/* Departments Grid */}
            {orgData && orgData.departments.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {orgData.departments.map((dept: any) => (
                  <Card key={dept.id} className="bg-white hover:shadow-lg transition-shadow border-2 border-[#d3b78f]/30">
                    <CardHeader className="bg-gradient-to-br from-[#f8f9fa] to-white pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#d3b78f] rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-[#242d53] font-bold">{dept.name}</CardTitle>
                            <CardDescription className="text-xs text-gray-600">{dept.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-[#242d53]" />
                          <span className="text-gray-600">Head:</span>
                          <span className="font-semibold text-[#242d53]">{dept.headOfDepartment}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-[#242d53]" />
                          <span className="text-gray-600">Email:</span>
                          <span className="font-semibold text-[#d3b78f]">{dept.email}</span>
                        </div>
                        {dept.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-[#242d53]" />
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-semibold text-[#242d53]">{dept.phoneNumber}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Cpu className="w-4 h-4 text-[#242d53]" />
                          <span className="text-gray-600">Max Devices:</span>
                          <span className="font-semibold text-[#242d53]">{dept.maxDevices}</span>
                        </div>
                        
                        <div className="pt-3 border-t border-gray-200 flex gap-2">
                          <Button size="sm" className="flex-1 bg-[#242d53] text-white hover:bg-[#1a2340] font-medium">
                            View Details
                          </Button>
                          <Button size="sm" className="flex-1 bg-[#d3b78f] text-[#242d53] hover:bg-[#c9a876] font-medium">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-[#242d53]/10">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-[#d3b78f]" />
                    <p className="text-[#242d53] mb-2 font-semibold">No departments found</p>
                    <p className="text-sm text-[#5B6B8F] mb-4">Get started by creating your first department</p>
                    <Button className="bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90 border-2 border-transparent hover:border-[#d3b78f]">
                      <Building2 className="w-4 h-4 mr-2" />
                      Add Department
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
