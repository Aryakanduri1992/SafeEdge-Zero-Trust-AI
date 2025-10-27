
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Organization, Department } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, HardDrive, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

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
  const { user, departments, isLoading, globalSearchTerm } = useAuth();
  const orgUser = user as Organization;

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
      const matchesSearch = globalSearchTerm ? searchCorpus.includes(globalSearchTerm.toLowerCase()) : true;
      const matchesLocation = locationFilter === 'all' || dept.location === locationFilter;
      const matchesBuilding = buildingFilter === 'all' || dept.building === buildingFilter;
      const matchesFloor = floorFilter === 'all' || dept.floor === floorFilter;
      const matchesStatus = statusFilter === 'all' || dept.status === statusFilter;
      return matchesSearch && matchesLocation && matchesBuilding && matchesFloor && matchesStatus;
    });
  }, [departments, globalSearchTerm, locationFilter, buildingFilter, floorFilter, statusFilter]);
  
  const activeFilterCount = [locationFilter, buildingFilter, floorFilter, statusFilter].filter(f => f !== 'all').length;

  const handleResetFilters = () => {
    setLocationFilter('all');
    setBuildingFilter('all');
    setFloorFilter('all');
    setStatusFilter('all');
  };

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
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Department List</CardTitle>
              <CardDescription>
                A list of all registered departments within your organization.
              </CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                 <Button variant="outline" className="relative w-full sm:w-auto shrink-0">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter Departments
                    {activeFilterCount > 0 && (
                        <Badge variant="destructive" className="absolute -right-2 -top-2 h-5 w-5 justify-center rounded-full p-0">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filters</h4>
                    <p className="text-sm text-muted-foreground">
                      Refine your department list.
                    </p>
                  </div>
                  <Separator />
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="filter-location">Location</Label>
                       <Select value={locationFilter} onValueChange={setLocationFilter}>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Locations</SelectItem>
                              {uniqueLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>
                     <div className="grid gap-2">
                      <Label htmlFor="filter-building">Building</Label>
                       <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a building" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Buildings</SelectItem>
                              {uniqueBuildings.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>
                     <div className="grid gap-2">
                      <Label htmlFor="filter-floor">Floor</Label>
                      <Select value={floorFilter} onValueChange={setFloorFilter}>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a floor" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Floors</SelectItem>
                              {uniqueFloors.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>
                     <div className="grid gap-2">
                      <Label htmlFor="filter-status">Status</Label>
                      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                          <SelectTrigger>
                              <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                  </div>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full justify-center"
                    onClick={handleResetFilters}
                    disabled={activeFilterCount === 0}
                  >
                    Reset Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {departments.length > 0 ? (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="hidden sm:table-cell">Location</TableHead>
                    <TableHead className="hidden md:table-cell">Building</TableHead>
                    <TableHead className="hidden lg:table-cell">Floor</TableHead>
                    <TableHead className="text-center">Device Quota</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell>
                        <div className="font-medium">{dept.departmentName}</div>
                        <div className="text-xs text-muted-foreground font-mono hidden sm:block">{dept.organizationName}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{dept.location}</TableCell>
                      <TableCell className="hidden md:table-cell">{dept.building}</TableCell>
                      <TableCell className="hidden lg:table-cell">{dept.floor}</TableCell>
                      <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                             <HardDrive className="h-4 w-4 text-muted-foreground"/> 
                             <span>{dept.devices}</span>
                          </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {dept.status === 'active' ? (
                          <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>
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
            </div>
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

    