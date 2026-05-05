const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, '..', 'data', 'blackshield-x.db');
const db = new Database(dbPath);

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Create test organization
const orgId = generateId();
const insertOrg = db.prepare(`
  INSERT INTO organizations (id, name, created_at, updated_at)
  VALUES (?, ?, ?, ?)
`);

insertOrg.run(orgId, 'Test Organization', new Date().toISOString(), new Date().toISOString());

// Create test user
const userId = generateId();
const insertUser = db.prepare(`
  INSERT INTO users (id, email, password_hash, role, organization_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run(
  userId, 
  'admin@test.com', 
  'hashed_password_123', 
  'admin', 
  orgId, 
  new Date().toISOString(), 
  new Date().toISOString()
);

// Create test floor plan
const floorPlanId = generateId();
const testFloorPlan = {
  floors: [
    {
      id: generateId(),
      name: 'Ground Floor',
      rooms: [
        {
          id: generateId(),
          name: 'Reception',
          type: 'office',
          position: { x: 100, y: 100 },
          dimensions: { width: 200, height: 150 }
        },
        {
          id: generateId(),
          name: 'Conference Room',
          type: 'meeting',
          position: { x: 350, y: 100 },
          dimensions: { width: 300, height: 200 }
        }
      ]
    }
  ]
};

const insertFloorPlan = db.prepare(`
  INSERT INTO floor_plans (id, organization_id, name, floors, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertFloorPlan.run(
  floorPlanId,
  orgId,
  'Main Building Floor Plan',
  JSON.stringify(testFloorPlan.floors),
  new Date().toISOString(),
  new Date().toISOString()
);

// Create test devices
const devices = [
  {
    id: generateId(),
    name: 'Security Camera 1',
    type: 'camera',
    room_id: testFloorPlan.floors[0].rooms[0].id
  },
  {
    id: generateId(),
    name: 'Motion Sensor 1',
    type: 'sensor',
    room_id: testFloorPlan.floors[0].rooms[1].id
  },
  {
    id: generateId(),
    name: 'Access Control Panel',
    type: 'access_control',
    room_id: testFloorPlan.floors[0].rooms[0].id
  }
];

const insertDevice = db.prepare(`
  INSERT INTO devices (id, organization_id, floor_plan_id, room_id, name, type, status, position_x, position_y, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

devices.forEach(device => {
  insertDevice.run(
    device.id,
    orgId,
    floorPlanId,
    device.room_id,
    device.name,
    device.type,
    'active',
    Math.random() * 500,
    Math.random() * 300,
    new Date().toISOString(),
    new Date().toISOString()
  );
});

// Create Safe Edge
const safeEdgeId = generateId();
const insertSafeEdge = db.prepare(`
  INSERT INTO safe_edges (id, organization_id, status, connected_boxes, cloud_endpoint, last_sync)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertSafeEdge.run(
  safeEdgeId,
  orgId,
  'online',
  JSON.stringify([]),
  `https://cloud.safeedge.com/org/${orgId}`,
  new Date().toISOString()
);

// Create Ethernet Box
const ethernetBoxId = generateId();
const insertEthernetBox = db.prepare(`
  INSERT INTO ethernet_boxes (id, organization_id, safe_edge_id, connected_devices, status, max_capacity)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertEthernetBox.run(
  ethernetBoxId,
  orgId,
  safeEdgeId,
  JSON.stringify(devices.map(d => d.id)),
  'active',
  50
);

console.log('✅ Test data initialized successfully!');
console.log(`Organization ID: ${orgId}`);
console.log(`User: admin@test.com`);
console.log(`Floor Plan ID: ${floorPlanId}`);
console.log(`Devices: ${devices.length} created`);

db.close();