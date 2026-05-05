"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) {
    return (
      <LayoutWrapper>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-gray-200">Manage your account settings</p>
        </div>

        {/* Profile Information */}
        <Card className="border-[#242d53]/10">
          <CardHeader>
            <CardTitle className="text-[#242d53]">Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-[#242d53] text-[#d3b78f] text-2xl">
                  {user.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg text-[#242d53]">{user.organizationName}</h3>
                <p className="text-sm text-[#5B6B8F]">{user.email}</p>
                <Button variant="outline" size="sm" className="mt-2 border-[#d3b78f] text-[#d3b78f] hover:bg-[#d3b78f] hover:text-[#242d53]">Change Avatar</Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#242d53]">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5B6B8F]" />
                  <Input id="email" type="email" defaultValue={user.email} className="pl-10 border-[#242d53]/20 focus:border-[#d3b78f]" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization" className="text-[#242d53]">Organization</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5B6B8F]" />
                  <Input id="organization" defaultValue={user.organizationName} className="pl-10 border-[#242d53]/20 bg-gray-50" disabled />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="border-[#242d53] text-[#242d53] hover:bg-[#242d53] hover:text-white">Cancel</Button>
                <Button className="bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90">Save Changes</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-[#242d53]/10">
          <CardHeader>
            <CardTitle className="text-[#242d53]">Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-[#242d53]">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5B6B8F]" />
                <Input id="currentPassword" type="password" className="pl-10 border-[#242d53]/20 focus:border-[#d3b78f]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-[#242d53]">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5B6B8F]" />
                <Input id="newPassword" type="password" className="pl-10 border-[#242d53]/20 focus:border-[#d3b78f]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#242d53]">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5B6B8F]" />
                <Input id="confirmPassword" type="password" className="pl-10 border-[#242d53]/20 focus:border-[#d3b78f]" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" className="border-[#242d53] text-[#242d53] hover:bg-[#242d53] hover:text-white">Cancel</Button>
              <Button className="bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90">Update Password</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-[#242d53]/10">
          <CardHeader>
            <CardTitle className="text-[#242d53]">Notification Preferences</CardTitle>
            <CardDescription>Choose how you want to be notified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-[#242d53]/10 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#242d53]">Email Notifications</h4>
                  <p className="text-sm text-[#5B6B8F]">Receive email updates about your account</p>
                </div>
                <Button variant="outline" className="border-[#6B8E6F] text-[#6B8E6F] hover:bg-[#6B8E6F] hover:text-white">Enabled</Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-[#242d53]/10 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#242d53]">Security Alerts</h4>
                  <p className="text-sm text-[#5B6B8F]">Get notified about security events</p>
                </div>
                <Button variant="outline" className="border-[#6B8E6F] text-[#6B8E6F] hover:bg-[#6B8E6F] hover:text-white">Enabled</Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-[#242d53]/10 rounded-lg">
                <div>
                  <h4 className="font-medium text-[#242d53]">Device Status Updates</h4>
                  <p className="text-sm text-[#5B6B8F]">Alerts when devices go online/offline</p>
                </div>
                <Button variant="outline" className="border-[#6B8E6F] text-[#6B8E6F] hover:bg-[#6B8E6F] hover:text-white">Enabled</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  );
}
