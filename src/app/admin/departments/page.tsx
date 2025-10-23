
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Organization, Department } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, HardDrive, Search, Filter, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-1/2" />
    <Skeleton className="h-8 w-3/4" />
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function DepartmentsPage() {
  const { user, departments, isLoading } = useAuth();
  const orgUser = user as Organization;

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const { uniqueLocations, uniqueBuildings, uniqueFloors } = useMemo(() => {
    const locations = new Set<string>();
    const buildings = new Set<string>();
    const floors = new Set<string>();
    departments.forEach(dept => {
      locations.add(dept.location);
      buildings.add(dept.building);
      floors.add(dept.floor);
    });
    return {
      uniqueLocations: Array.from(locations).sort(),
      uniqueBuildings: Array.from(buildings).sort(),
      uniqueFloors: Array.from(floors).sort(),
    };
  }, [departments]);
  
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
      const searchCorpus = `${dept.departmentName} ${dept.location} ${dept.building} ${dept.floor}`.toLowerCase();
      const matchesSearch = searchCorpus.includes(searchTerm.toLowerCase());
      const matchesLocation = locationFilter === 'all' || dept.location === locationFilter;
      const matchesBuilding = buildingFilter === 'all' || dept.building === buildingFilter;
      const matchesFloor = floorFilter === 'all' || dept.floor === floorFilter;
      const matchesStatus = statusFilter === 'all' || dept.status === statusFilter;
      return matchesSearch && matchesLocation && matchesBuilding && matchesFloor && matchesStatus;
    });
  }, [departments, searchTerm, locationFilter, buildingFilter, floorFilter, statusFilter]);

  if (isLoading || !orgUser) {
    return <LoadingSkeleton />;
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
        <p className="text-muted-foreground">
          Viewing all departments for {orgUser.organizationName}.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Department List</CardTitle>
          <CardDescription>
            A list of all registered departments within your organization.
          </CardDescription>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  Location: {locationFilter === 'all' ? 'All' : locationFilter} <ChevronDown className="ml-2 h-4 w-4"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={locationFilter} onValueChange={setLocationFilter}>
                    <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                    {uniqueLocations.map(loc => <DropdownMenuRadioItem key={loc} value={loc}>{loc}</DropdownMenuRadioItem>)}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  Building: {buildingFilter === 'all' ? 'All' : buildingFilter} <ChevronDown className="ml-2 h-4 w-4"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={buildingFilter} onValueChange={setBuildingFilter}>
                    <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                    {uniqueBuildings.map(b => <DropdownMenuRadioItem key={b} value={b}>{b}</DropdownMenuRadioItem>)}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  Floor: {floorFilter === 'all' ? 'All' : floorFilter} <ChevronDown className="ml-2 h-4 w-4"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={floorFilter} onValueChange={setFloorFilter}>
                    <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                    {uniqueFloors.map(f => <DropdownMenuRadioItem key={f} value={f}>{f}</DropdownMenuRadioItem>)}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                   Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} <ChevronDown className="ml-2 h-4 w-4"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                    <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="active">Active</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="inactive">Inactive</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {departments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead className="text-center">Device Quota</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <div className="font-medium">{dept.departmentName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{dept.organizationName}</div>
                    </TableCell>
                    <TableCell>{dept.location}</TableCell>
                    <TableCell>{dept.building}</TableCell>
                    <TableCell>{dept.floor}</TableCell>
                    <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                           <HardDrive className="h-4 w-4 text-muted-foreground"/> 
                           <span>{dept.devices}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {dept.status === 'active' ? (
                        <Badge variant="outline" className="text-green-400 border-green-400/50"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"><XCircle className="mr-1 h-3 w-3" />Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDepartments.length === 0 && (
                   <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No departments found matching your criteria.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
             <div className="text-center py-16">
                <h3 className="mt-2 text-lg font-semibold">No Departments Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    This organization does not have any departments configured yet.
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
