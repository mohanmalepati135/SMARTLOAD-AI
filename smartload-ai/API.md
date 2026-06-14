# SmartLoad AI — API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production:  https://your-domain.com/api
```

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

Tokens expire in 15 minutes. Use `/auth/refresh-token` to get a new access token.

---

## Response Format

All responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed validation errors"]
}
```

---

## Auth Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "securePassword123",
  "companyName": "Acme Logistics",
  "phoneNumber": "+1 555-000-0000"
}
```

**Response:**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "64f8a2b3c9d8e7f6a5b4c3d2",
    "name": "John Doe",
    "email": "john@company.com",
    "role": "user",
    "companyName": "Acme Logistics"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Validation Rules:**
- `name`: Required, non-empty string
- `email`: Valid email format, unique
- `password`: Minimum 6 characters
- `companyName`: Required
- `phoneNumber`: Required

---

### POST /auth/login
Authenticate and receive tokens.

**Request Body:**
```json
{
  "email": "john@company.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "64f8a2b3c9d8e7f6a5b4c3d2",
    "name": "John Doe",
    "email": "john@company.com",
    "role": "user",
    "companyName": "Acme Logistics",
    "phoneNumber": "+1 555-000-0000"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**
- `401`: Invalid credentials or inactive account

---

### POST /auth/refresh-token
Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### POST /auth/logout
Invalidate refresh token.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /auth/me
Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "_id": "64f8a2b3c9d8e7f6a5b4c3d2",
  "name": "John Doe",
  "email": "john@company.com",
  "companyName": "Acme Logistics",
  "phoneNumber": "+1 555-000-0000",
  "role": "user",
  "isActive": true,
  "lastLogin": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-10T08:00:00.000Z"
}
```

---

## Vehicle Endpoints

### GET /vehicles
List all vehicles with pagination, search, and filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| search | string | - | Search vehicle number or driver name |
| status | string | - | Filter by status: active, inactive, maintenance, on_trip |
| sortBy | string | createdAt | Sort field |

**Response:**
```json
{
  "vehicles": [
    {
      "_id": "64f8a2b3c9d8e7f6a5b4c3d2",
      "vehicleNumber": "TRK-001",
      "driverName": "Mike Smith",
      "driverPhone": "+1 555-111-2222",
      "vehicleType": "truck",
      "capacity": 5000,
      "licenseNumber": "LIC-123456",
      "status": "active",
      "currentWeight": 3200,
      "totalTrips": 45,
      "totalCargoWeight": 142000,
      "lastTripDate": "2024-01-14T16:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 48
}
```

---

### POST /vehicles
Create a new vehicle.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "vehicleNumber": "TRK-002",
  "driverName": "Sarah Johnson",
  "driverPhone": "+1 555-333-4444",
  "vehicleType": "van",
  "capacity": 2500,
  "licenseNumber": "LIC-789012",
  "status": "active"
}
```

**Validation:**
- `vehicleNumber`: Required, unique, uppercase
- `driverName`: Required
- `driverPhone`: Required
- `vehicleType`: Enum: truck, van, container, trailer, pickup
- `capacity`: Required, number ≥ 0
- `licenseNumber`: Required

**Response:**
```json
{
  "_id": "64f8a2b3c9d8e7f6a5b4c3d3",
  "vehicleNumber": "TRK-002",
  "driverName": "Sarah Johnson",
  ...
}
```

---

### GET /vehicles/:id
Get vehicle details with recent weight logs.

**Response:**
```json
{
  "vehicle": { ... },
  "recentLogs": [
    {
      "_id": "...",
      "weight": 3200,
      "entryType": "simulation",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### PUT /vehicles/:id
Update vehicle information.

**Request Body:** (any fields to update)
```json
{
  "driverName": "Updated Name",
  "status": "maintenance"
}
```

---

### DELETE /vehicles/:id
Delete a vehicle.

**Response:**
```json
{
  "message": "Vehicle deleted"
}
```

---

### GET /vehicles/stats
Get vehicle statistics.

**Response:**
```json
{
  "totalVehicles": 48,
  "activeVehicles": 42,
  "totalCapacity": 245000,
  "avgCapacity": 5104
}
```

---

## Shipment Endpoints

### GET /shipments
List shipments with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| status | string | pending, in_transit, delivered, cancelled |
| vehicle | string | Vehicle ID |
| search | string | Search shipment ID or cargo type |

**Response:**
```json
{
  "shipments": [
    {
      "_id": "64f8a2b3c9d8e7f6a5b4c3d4",
      "shipmentId": "SHP-1705312800000-123",
      "cargoType": "Electronics",
      "buyer": "TechCorp Inc.",
      "seller": "Global Suppliers Ltd.",
      "origin": "New York, NY",
      "destination": "Los Angeles, CA",
      "vehicle": { "_id": "...", "vehicleNumber": "TRK-001", "driverName": "Mike Smith" },
      "vehicleNumber": "TRK-001",
      "weight": 3200,
      "status": "in_transit",
      "shipmentDate": "2024-01-15T08:00:00.000Z",
      "deliveryDate": "2024-01-18T08:00:00.000Z",
      "revenue": 4500,
      "riskScore": 35,
      "aiRecommendations": ["Vehicle only 64% loaded. Consider combining shipments."],
      "createdAt": "2024-01-15T08:00:00.000Z"
    }
  ],
  "totalPages": 3,
  "currentPage": 1,
  "total": 25
}
```

---

### POST /shipments
Create a new shipment with AI risk assessment.

**Request Body:**
```json
{
  "cargoType": "Electronics",
  "buyer": "TechCorp Inc.",
  "seller": "Global Suppliers Ltd.",
  "origin": "New York, NY",
  "destination": "Los Angeles, CA",
  "vehicle": "64f8a2b3c9d8e7f6a5b4c3d2",
  "shipmentDate": "2024-01-15T08:00:00.000Z",
  "deliveryDate": "2024-01-18T08:00:00.000Z",
  "weight": 3200,
  "revenue": 4500,
  "notes": "Fragile items, handle with care"
}
```

**Auto-generated fields:**
- `shipmentId`: `SHP-<timestamp>-<random>`
- `vehicleNumber`: From selected vehicle
- `riskScore`: AI-calculated (0-100)
- `aiRecommendations`: Array of recommendation strings

**Response:**
```json
{
  "_id": "64f8a2b3c9d8e7f6a5b4c3d4",
  "shipmentId": "SHP-1705312800000-123",
  "cargoType": "Electronics",
  "riskScore": 35,
  "aiRecommendations": ["Vehicle only 64% loaded. Consider combining shipments."],
  ...
}
```

---

### GET /shipments/:id
Get shipment details.

---

### PUT /shipments/:id
Update shipment status or details.

---

### DELETE /shipments/:id
Delete a shipment.

---

## Weight Endpoints

### POST /weights/simulation
Trigger a simulation weight reading for a vehicle.

**Request Body:**
```json
{
  "vehicleId": "64f8a2b3c9d8e7f6a5b4c3d2"
}
```

**Process:**
1. Generates random weight (500-1000kg base ±5kg variation)
2. Checks for overload against vehicle capacity
3. Creates WeightLog entry with `entryType: "simulation"`
4. If overloaded, creates Alert and sets `isOverload: true`
5. Updates vehicle `currentWeight`
6. Emits `weight_update` event via Socket.io

**Response:**
```json
{
  "weightLog": {
    "_id": "...",
    "vehicle": "64f8a2b3c9d8e7f6a5b4c3d2",
    "vehicleNumber": "TRK-001",
    "weight": 847,
    "entryType": "simulation",
    "cargoType": "Mixed Cargo",
    "isOverload": false,
    "overloadPercentage": 0,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "overload": {
    "isOverload": false,
    "percentage": 0,
    "severity": "low"
  }
}
```

---

### POST /weights/machine
Receive weight from a connected weighing machine.

**Request Body:**
```json
{
  "deviceId": "USB-SCALE-001",
  "weight": 2450.5,
  "vehicleId": "64f8a2b3c9d8e7f6a5b4c3d2",
  "cargoType": "Electronics",
  "expectedWeight": 2500
}
```

**Process:**
1. Records weight from hardware device
2. Runs overload detection
3. Runs fraud detection (compares against expectedWeight)
4. Creates WeightLog with `entryType: "machine"`
5. Emits real-time update via Socket.io

**Response:**
```json
{
  "weightLog": { ... },
  "overload": { "isOverload": false, "percentage": 0, "severity": "low" },
  "fraud": {
    "isFraudulent": false,
    "difference": 49.5,
    "percentageDiff": 1.98,
    "expectedWeight": 2500,
    "severity": "low"
  }
}
```

---

### POST /weights/manual
Create a manual weight entry.

**Request Body:**
```json
{
  "vehicleNumber": "TRK-003",
  "driverName": "Tom Wilson",
  "cargoType": "Furniture",
  "weight": 1800,
  "buyer": "Home Depot",
  "seller": "Furniture Factory",
  "location": "Warehouse A, Dock 3",
  "notes": "Careful with glass items"
}
```

**Process:**
1. If vehicle doesn't exist, auto-creates it with default values
2. Creates WeightLog with `entryType: "manual"`
3. Updates vehicle weight and driver info
4. Emits real-time update via Socket.io

**Response:**
```json
{
  "_id": "...",
  "vehicle": "64f8a2b3c9d8e7f6a5b4c3d5",
  "vehicleNumber": "TRK-003",
  "weight": 1800,
  "entryType": "manual",
  "cargoType": "Furniture",
  "buyer": "Home Depot",
  "seller": "Furniture Factory",
  "location": "Warehouse A, Dock 3",
  "notes": "Careful with glass items",
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

---

### GET /weights/logs
Get weight logs with filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page (default: 20) |
| vehicle | string | Vehicle ID filter |
| entryType | string | simulation, machine, manual |
| startDate | ISO date | Filter from date |
| endDate | ISO date | Filter to date |

**Response:**
```json
{
  "logs": [
    {
      "_id": "...",
      "vehicle": { "vehicleNumber": "TRK-001", "driverName": "Mike Smith", "capacity": 5000 },
      "vehicleNumber": "TRK-001",
      "weight": 847,
      "entryType": "simulation",
      "isOverload": false,
      "overloadPercentage": 0,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalPages": 10,
  "currentPage": 1,
  "total": 195
}
```

---

### GET /weights/stats
Get weight statistics.

**Response:**
```json
{
  "overall": {
    "totalEntries": 195,
    "totalWeight": 487250,
    "averageWeight": 2498.72,
    "maxWeight": 5200,
    "minWeight": 495
  },
  "byEntryType": [
    { "_id": "simulation", "count": 120, "totalWeight": 301200 },
    { "_id": "manual", "count": 45, "totalWeight": 112500 },
    { "_id": "machine", "count": 30, "totalWeight": 73550 }
  ]
}
```

---

## AI Endpoints

### GET /ai/insights
Get comprehensive AI analytics.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| vehicleId | string | - | Filter by specific vehicle |
| period | string | 7d | Analysis period (days) |

**Response:**
```json
{
  "weightTrend": {
    "trend": "increasing",
    "change": 125.5,
    "percentChange": 5.2,
    "average": 2548.72,
    "peak": 5200,
    "lowest": 495
  },
  "revenuePrediction": {
    "predictions": [
      { "period": 1, "predictedRevenue": 4850.25, "date": "2024-01-16T00:00:00.000Z" },
      { "period": 2, "predictedRevenue": 4920.50, "date": "2024-01-17T00:00:00.000Z" }
    ],
    "confidence": 87.5,
    "trend": "upward"
  },
  "utilization": [
    { "vehicle": "TRK-001", "utilization": 64.0, "status": "active" },
    { "vehicle": "TRK-002", "utilization": 32.5, "status": "active" }
  ],
  "overloadSummary": {
    "count": 3,
    "totalOverload": 45.2,
    "averageOverload": 15.07
  },
  "totalAnalyzed": 195
}
```

---

### GET /ai/risk-analysis
Get risk analysis for all active shipments.

**Response:**
```json
{
  "risks": [
    {
      "shipmentId": "SHP-1705312800000-123",
      "vehicleNumber": "TRK-001",
      "riskScore": 35,
      "level": "medium",
      "factors": [
        { "type": "long_distance", "weight": 15 }
      ],
      "recommendations": [
        { "type": "underutilization", "priority": "medium", "message": "Vehicle only 64% loaded. Consider combining shipments.", "action": "combine_shipments" }
      ]
    }
  ],
  "highRiskCount": 2,
  "averageRisk": 28.5
}
```

---

### GET /ai/recommendations
Get smart recommendations for all vehicles.

**Response:**
```json
{
  "recommendations": [
    {
      "type": "overload",
      "priority": "high",
      "message": "Vehicle overloaded by 12.5%. Recommend splitting shipment.",
      "action": "split_shipment",
      "vehicleNumber": "TRK-003"
    },
    {
      "type": "underutilization",
      "priority": "medium",
      "message": "Vehicle only 32.5% loaded. Consider combining shipments.",
      "action": "combine_shipments",
      "vehicleNumber": "TRK-002"
    }
  ],
  "total": 5,
  "highPriority": 2
}
```

---

## Alert Endpoints

### GET /alerts
Get alerts with filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| severity | string | low, medium, high |
| isResolved | boolean | true/false |
| type | string | overload, weight_mismatch, machine_disconnected, shipment_delay, high_risk, fraud_detected |

**Response:**
```json
{
  "alerts": [
    {
      "_id": "...",
      "type": "overload",
      "severity": "high",
      "title": "Vehicle Overload Detected",
      "message": "Vehicle TRK-003 is overloaded by 12.5%",
      "vehicle": { "vehicleNumber": "TRK-003" },
      "vehicleNumber": "TRK-003",
      "isResolved": false,
      "metadata": { "isOverload": true, "percentage": 12.5, "severity": "high" },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalPages": 2,
  "currentPage": 1,
  "total": 15,
  "unreadCount": 8
}
```

---

### GET /alerts/stats
Get alert statistics.

**Response:**
```json
{
  "overall": {
    "total": 45,
    "unresolved": 8,
    "highSeverity": 3
  },
  "byType": [
    { "_id": "overload", "count": 5 },
    { "_id": "high_risk", "count": 2 }
  ]
}
```

---

### PATCH /alerts/:id/resolve
Mark an alert as resolved.

**Response:**
```json
{
  "_id": "...",
  "isResolved": true,
  "resolvedAt": "2024-01-15T11:00:00.000Z",
  "resolvedBy": "64f8a2b3c9d8e7f6a5b4c3d2"
}
```

---

## Dashboard Endpoint

### GET /dashboard
Get complete dashboard data.

**Response:**
```json
{
  "kpi": {
    "totalVehicles": 48,
    "pendingShipments": 12,
    "totalRevenue": 125000,
    "totalCargoWeight": 487250
  },
  "recentActivity": {
    "weightLogs": [ ... ],
    "shipments": [ ... ],
    "alerts": [ ... ]
  },
  "analytics": {
    "dailyShipments": [
      { "_id": "2024-01-15", "count": 5, "revenue": 22500 }
    ],
    "dailyWeights": [
      { "_id": "2024-01-15", "totalWeight": 12500, "avgWeight": 2500, "count": 5 }
    ],
    "vehicleStatusDist": [
      { "_id": "active", "count": 42 },
      { "_id": "maintenance", "count": 6 }
    ],
    "shipmentStatusDist": [
      { "_id": "pending", "count": 12 },
      { "_id": "in_transit", "count": 8 },
      { "_id": "delivered", "count": 25 }
    ]
  }
}
```

---

## Report Endpoints

### GET /reports/shipments
Generate shipment report.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | json, csv, pdf |
| startDate | ISO date | Filter from |
| endDate | ISO date | Filter to |
| status | string | Filter by status |

**CSV Response:** Downloadable CSV file with columns: shipmentId, cargoType, buyer, seller, origin, destination, vehicleNumber, weight, status, revenue, shipmentDate, createdAt

**PDF Response:** Styled PDF with gradient header, colored status badges, table layout

---

### GET /reports/vehicles
Generate vehicle report.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | json, csv |

---

### GET /reports/weight-logs
Generate weight log report.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| format | string | json, csv |
| entryType | string | simulation, machine, manual |
| startDate | ISO date | Filter from |
| endDate | ISO date | Filter to |

---

## Socket.io Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_user_room` | `{ userId: string }` | Join user-specific room for targeted updates |
| `start_simulation` | `{ vehicleId: string, userId: string }` | Start weight simulation |
| `stop_simulation` | - | Stop simulation |
| `machine_weight` | `{ userId: string, weight: number, deviceId: string }` | Send machine weight |
| `manual_entry` | `{ userId: string, ... }` | Send manual entry |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `simulation_weight` | `{ vehicleId: string, weight: number, timestamp: Date }` | New simulation weight |
| `machine_weight_update` | `{ weight: number, deviceId: string, timestamp: Date }` | Machine weight update |
| `weight_update` | `{ vehicleId: string, weight: number, entryType: string, overload: object, fraud: object }` | General weight update |
| `manual_entry_update` | `{ ... }` | Manual entry confirmed |

---

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | ValidationError | Invalid input data |
| 400 | Duplicate | Duplicate field (e.g., email, vehicleNumber) |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Admin access required |
| 404 | Not Found | Resource not found |
| 429 | Rate Limit | Too many requests |
| 500 | Server Error | Internal server error |

---

## Data Models

### User
```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, min 6, hashed),
  companyName: String (required),
  phoneNumber: String (required),
  role: String (enum: ['admin', 'user'], default: 'user'),
  avatar: String (default: ''),
  isActive: Boolean (default: true),
  lastLogin: Date,
  refreshTokens: [{ token: String, createdAt: Date }],
  timestamps: true
}
```

### Vehicle
```javascript
{
  vehicleNumber: String (required, unique, uppercase),
  driverName: String (required),
  driverPhone: String (required),
  vehicleType: String (enum: ['truck', 'van', 'container', 'trailer', 'pickup']),
  capacity: Number (required, min 0),
  licenseNumber: String (required),
  status: String (enum: ['active', 'inactive', 'maintenance', 'on_trip'], default: 'active'),
  currentWeight: Number (default: 0),
  totalTrips: Number (default: 0),
  totalCargoWeight: Number (default: 0),
  lastTripDate: Date,
  createdBy: ObjectId (ref: User, required),
  timestamps: true
}
```

### Shipment
```javascript
{
  shipmentId: String (required, unique, auto-generated),
  cargoType: String (required),
  buyer: String (required),
  seller: String (required),
  origin: String (required),
  destination: String (required),
  vehicle: ObjectId (ref: Vehicle, required),
  vehicleNumber: String (required),
  weight: Number (default: 0),
  status: String (enum: ['pending', 'in_transit', 'delivered', 'cancelled'], default: 'pending'),
  shipmentDate: Date (required),
  deliveryDate: Date,
  revenue: Number (default: 0),
  notes: String,
  riskScore: Number (default: 0, min 0, max 100),
  aiRecommendations: [String],
  createdBy: ObjectId (ref: User, required),
  timestamps: true
}
```

### WeightLog
```javascript
{
  vehicle: ObjectId (ref: Vehicle, required),
  vehicleNumber: String (required),
  weight: Number (required),
  entryType: String (enum: ['simulation', 'machine', 'manual'], required),
  cargoType: String,
  buyer: String,
  seller: String,
  location: String,
  notes: String,
  isOverload: Boolean (default: false),
  overloadPercentage: Number (default: 0),
  deviceId: String,
  deviceType: String (enum: ['usb', 'bluetooth', 'serial', 'esp32', 'arduino', 'api']),
  createdBy: ObjectId (ref: User, required),
  timestamps: true
}
```

### Alert
```javascript
{
  type: String (enum: ['overload', 'weight_mismatch', 'machine_disconnected', 'shipment_delay', 'high_risk', 'fraud_detected'], required),
  severity: String (enum: ['low', 'medium', 'high'], required),
  title: String (required),
  message: String (required),
  vehicle: ObjectId (ref: Vehicle),
  vehicleNumber: String,
  shipment: ObjectId (ref: Shipment),
  isResolved: Boolean (default: false),
  resolvedAt: Date,
  resolvedBy: ObjectId (ref: User),
  metadata: Mixed,
  createdFor: ObjectId (ref: User, required),
  timestamps: true
}
```
