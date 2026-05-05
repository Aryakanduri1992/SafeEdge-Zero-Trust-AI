# 🚀 Quick Access Guide - 3D Floor Plan

## 🔐 Step 1: Login
1. **Go to**: `http://localhost:9002`
2. **Login with**:
   - Email: `admin@advancedtest.com`
   - Password: `secure123`

## 🏢 Step 2: Access 3D Floor Plan

### Option A: From Dashboard (Recommended)
1. After login, you'll be on the **Admin Dashboard**
2. Look for the **Quick Access** section (should have 3 cards)
3. Click on the **"3D Floor Plan"** card (green colored)
4. This will take you to: `/admin/3d-floor-plan-simple`

### Option B: Direct URL
If you don't see the 3D Floor Plan card in the dashboard:
1. **Direct URL**: `http://localhost:9002/admin/3d-floor-plan-simple`
2. Navigate directly to this URL after logging in

### Option C: Alternative 3D Views
If the simple 3D doesn't work, try these existing 3D pages:
1. **3D Floor Plan**: `http://localhost:9002/admin/3d-floor-plan`
2. **3D Test**: `http://localhost:9002/admin/3d-test`

## 🎯 What You Should See

The 3D Floor Plan will show:
- ✅ **3 Floors** stacked vertically
- ✅ **13 Rooms** with different colors based on type:
  - 🔵 Blue = Office
  - 🟣 Purple = Conference Room  
  - 🟠 Orange = Lobby
  - 🟤 Brown = Storage
  - 🔴 Red = Server Room
  - 🟢 Green = Kitchen
- ✅ **Devices** as colored spheres (green = online, red = offline)
- ✅ **Interactive Controls**:
  - Floor selection buttons
  - Show/Hide devices toggle
  - Auto-rotating camera view

## 🔧 Troubleshooting

### If 3D doesn't load:
1. **Check browser console** for errors (F12 → Console)
2. **Try different browser** (Chrome recommended for WebGL)
3. **Check if WebGL is enabled** in your browser

### If login fails:
1. **Check server logs** in terminal
2. **Try other credentials**:
   - SuperAdmin: `admin@test.com` / `hashed_password_123`
   - TechCorp: `admin@techcorp.com` / `password123`

### If dashboard doesn't show 3D link:
1. **Use direct URL**: `/admin/3d-floor-plan-simple`
2. **Check if you're logged in as organization user** (not superadmin)

## 📊 Expected Data

The 3D view will display the **Advanced Test Corp** organization with:
- **Floor 1**: Reception, Conference Room Alpha, Open Office, Storage (4 rooms)
- **Floor 2**: Office 201-203, Meeting Room Beta, Server Room (5 rooms)  
- **Floor 3**: Executive Office, Board Room, Kitchen, Break Room (4 rooms)
- **Total**: 13 rooms across 3 floors with ~30-50 IoT devices

## 🎉 Success Indicators

You'll know it's working when you see:
- ✅ 3D building with floors stacked vertically
- ✅ Rooms as colored rectangles with wireframe walls
- ✅ Floating labels showing room names and details
- ✅ Colored spheres representing IoT devices
- ✅ Smooth camera rotation around the building
- ✅ Interactive controls and statistics

If you still can't see the 3D view, let me know what you see instead!