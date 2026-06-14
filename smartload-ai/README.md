# SmartLoad AI

> AI-Powered Intelligent Cargo Weighing & Logistics Management Platform

A production-grade MERN stack application for intelligent cargo weighing, shipment tracking, and fleet management. Built with real-time weight monitoring, AI-powered fraud detection, overload alerts, and predictive analytics.

---

## Features

| Module | Description |
|--------|-------------|
| **Live Weighing** | 3 modes: Simulation (auto-generated weights), Machine Integration (USB/Bluetooth/Serial/ESP32/Arduino), Manual Entry |
| **AI Intelligence** | Overload detection, fraud analysis, revenue prediction (linear regression), risk scoring, smart recommendations |
| **Fleet Management** | Vehicle CRUD, driver management, capacity tracking, utilization bars |
| **Shipment Tracking** | Full lifecycle tracking, status management, route monitoring, revenue tracking |
| **Real-time Sync** | Socket.io powered live weight updates, dashboard refresh, notifications |
| **Alert Center** | Severity-based alerts (Low/Medium/High), auto-resolve, unread count badges |
| **Reports** | PDF & CSV export for shipments, vehicles, weight logs |
| **Analytics Dashboard** | KPI cards, area charts, line charts, pie charts, bar charts, activity feed |

---

## Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB Atlas** + **Mongoose** (ODM)
- **Socket.io** (real-time bidirectional communication)
- **JWT** authentication + refresh tokens
- **bcryptjs** password hashing
- **Puppeteer** (PDF generation)
- **@json2csv/plainjs** (CSV export)
- **Helmet** + **express-rate-limit** + **compression** (security & performance)

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** (utility-first styling)
- **Framer Motion** (animations)
- **Recharts** (data visualization)
- **React Hook Form** (form validation)
- **React Hot Toast** (notifications)
- **Lucide React** (icons)
- **Socket.io Client** (real-time updates)
- **Axios** (HTTP client)
- **React Router DOM** (routing)

---

## Prerequisites

- **Node.js** v18+ (download: [nodejs.org](https://nodejs.org))
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- **npm** (comes with Node.js)

---

## Project Structure

```
smartload-ai/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── vehicleController.js
│   │   ├── shipmentController.js
│   │   ├── weightController.js
│   │   ├── alertController.js
│   │   ├── aiController.js
│   │   ├── dashboardController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT verification + token generation
│   │   └── errorHandler.js    # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── Shipment.js
│   │   ├── WeightLog.js
│   │   ├── Alert.js
│   │   ├── MachineStatus.js
│   │   ├── AIPrediction.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vehicles.js
│   │   ├── shipments.js
│   │   ├── weights.js
│   │   ├── alerts.js
│   │   ├── ai.js
│   │   ├── dashboard.js
│   │   └── reports.js
│   ├── sockets/
│   │   └── socketManager.js   # Socket.io initialization + event handlers
│   ├── utils/
│   │   └── aiEngine.js        # AI algorithms (overload, fraud, prediction, risk)
│   ├── .env                   # Environment variables (create from template below)
│   ├── package.json
│   └── server.js              # Entry point
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   ├── useSocket.js
    │   │   ├── useDashboard.js
    │   │   ├── useVehicles.js
    │   │   ├── useShipments.js
    │   │   └── useAlerts.js
    │   ├── layouts/
    │   │   ├── AuthLayout.jsx
    │   │   └── MainLayout.jsx
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── VehiclesPage.jsx
    │   │   ├── ShipmentsPage.jsx
    │   │   ├── LiveWeighingPage.jsx
    │   │   ├── AIInsightsPage.jsx
    │   │   ├── AlertsPage.jsx
    │   │   ├── ReportsPage.jsx
    │   │   ├── ManualEntryPage.jsx
    │   │   └── SettingsPage.jsx
    │   ├── services/
    │   │   └── api.js           # Axios instance with interceptors
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## Setup Instructions

### Step 1: Extract the ZIP

Extract `smartload-ai.zip` to your preferred location.

```bash
cd smartload-ai
```

---

### Step 2: Configure Backend Environment

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000

# MongoDB Connection
# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/smartload-ai

# Option B: MongoDB Atlas (recommended for production)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartload-ai?retryWrites=true&w=majority

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

> **MongoDB Atlas Setup:**
> 1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
> 2. Create a free cluster (M0)
> 3. Database Access → Add New Database User → Create user
> 4. Network Access → Add IP Address → Allow from anywhere (0.0.0.0/0) for dev
> 5. Clusters → Connect → Drivers → Node.js → Copy connection string
> 6. Replace `username`, `password`, and `cluster` in the URI above

---

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

If you get peer dependency warnings:
```bash
npm install --legacy-peer-deps
```

---

### Step 4: Start Backend Server

```bash
# Development (with auto-reload via nodemon)
npm run dev

# Production
npm start
```

Server will run on **http://localhost:5000**

Health check: `GET http://localhost:5000/api/health`

---

### Step 5: Install Frontend Dependencies

Open a **new terminal**:

```bash
cd frontend
npm install
```

---

### Step 6: Start Frontend Dev Server

```bash
npm run dev
```

App will open at **http://localhost:5173**

Vite will proxy `/api` requests to `http://localhost:5000` automatically (configured in `vite.config.js`).

---

## Usage Guide

### 1. Register an Account
- Visit **http://localhost:5173**
- Click **Get Started** or go to **/register**
- Fill in: Name, Email, Password, Company Name, Phone Number
- You'll be auto-logged in and redirected to Dashboard

### 2. Add Your First Vehicle
- Navigate to **Vehicle-wise** tab
- Click **Add Vehicle**
- Fill: Vehicle Number, Driver Name, Phone, Type, Capacity, License
- The vehicle card will show with a live capacity bar

### 3. Create a Shipment
- Go to **Add Shipment** tab
- Select vehicle, fill cargo details, origin/destination, weight, revenue
- AI will auto-calculate risk score and generate recommendations

### 4. Live Weighing (3 Modes)

#### Simulation Mode
- Select a vehicle
- Click **Start Simulation**
- Watch weights auto-generate (e.g., 842kg, 845kg, 847kg) every 2.5 seconds
- Real-time chart updates, overload alerts fire automatically

#### Machine Mode
- Select your weighing device type (USB, Bluetooth, Serial, ESP32, Arduino)
- The architecture supports future hardware integration
- Weight data streams via Socket.io

#### Manual Entry
- Fill the form: Vehicle Number, Driver, Cargo Type, Weight, Location, Notes
- Entry is tagged as "Manual" and saved to database
- Appears in weight logs and dashboard

### 5. Monitor AI Insights
- **AI Insights** tab shows:
  - Weight trend analysis (increasing/decreasing/stable)
  - Revenue prediction (7-day forecast with confidence %)
  - Risk analysis per shipment (score + factors)
  - Smart recommendations (split shipment, combine, expedite)

### 6. Manage Alerts
- **Alerts Center** shows all system-generated alerts
- Severity: Low (blue), Medium (yellow), High (red)
- Click **Resolve** to mark as handled
- Unresolved count badge appears in navbar

### 7. Generate Reports
- **Reports** tab offers 3 report types
- Download as **CSV** (spreadsheet) or **PDF** (styled document)
- PDFs are generated server-side with Puppeteer + HTML templates

---

## Deployment

### Backend → Render/Railway/Heroku

1. Push code to GitHub
2. Connect repo to Render/Railway
3. Set environment variables in dashboard
4. Build command: `npm install`
5. Start command: `npm start`

### Frontend → Vercel/Netlify

1. Push frontend folder to GitHub
2. Connect to Vercel
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set environment variable: `VITE_API_URL=https://your-backend-url.com`

### MongoDB Atlas
- Already cloud-hosted, no deployment needed
- Ensure IP whitelist includes your server IP

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Server port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens |
| `FRONTEND_URL` | Yes | CORS allowed origin |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Vehicles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List vehicles (paginated) |
| POST | `/api/vehicles` | Create vehicle |
| GET | `/api/vehicles/:id` | Get vehicle details |
| PUT | `/api/vehicles/:id` | Update vehicle |
| DELETE | `/api/vehicles/:id` | Delete vehicle |
| GET | `/api/vehicles/stats` | Vehicle statistics |

### Shipments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shipments` | List shipments |
| POST | `/api/shipments` | Create shipment |
| GET | `/api/shipments/:id` | Get shipment |
| PUT | `/api/shipments/:id` | Update shipment |
| DELETE | `/api/shipments/:id` | Delete shipment |

### Weights
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/weights/simulation` | Trigger simulation weight |
| POST | `/api/weights/machine` | Receive machine weight |
| POST | `/api/weights/manual` | Create manual entry |
| GET | `/api/weights/logs` | Get weight logs |
| GET | `/api/weights/stats` | Weight statistics |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/insights` | AI analytics dashboard |
| GET | `/api/ai/risk-analysis` | Risk analysis per shipment |
| GET | `/api/ai/recommendations` | Smart recommendations |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | List alerts |
| GET | `/api/alerts/stats` | Alert statistics |
| PATCH | `/api/alerts/:id/resolve` | Resolve alert |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/shipments` | Shipment report (json/csv/pdf) |
| GET | `/api/reports/vehicles` | Vehicle report |
| GET | `/api/reports/weight-logs` | Weight log report |

---

## Troubleshooting

### `Cannot find module 'express'`
```bash
cd backend
npm install
```

### `No matching version found for json2csv@^6.0.0`
Fixed in latest version. Uses `@json2csv/plainjs@^7.0.1` instead.

### MongoDB connection errors
- Check `MONGODB_URI` in `.env`
- Ensure MongoDB is running (local) or Atlas IP whitelist is configured
- Verify username/password are URL-encoded if they contain special characters

### CORS errors in browser
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Default: `http://localhost:5173`

### Port already in use
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

---

## License

MIT License — Built for hackathons, portfolios, and production logistics operations.

---

## Support

For issues or questions, check:
1. Server logs in terminal
2. Browser DevTools → Network tab
3. MongoDB Atlas → Metrics & Logs
