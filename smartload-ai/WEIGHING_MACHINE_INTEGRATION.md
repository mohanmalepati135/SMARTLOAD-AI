# SmartLoad AI — Weighing Machine Integration Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Supported Devices & Protocols](#supported-devices--protocols)
3. [Integration Architecture](#integration-architecture)
4. [USB / Serial Port Integration](#usb--serial-port-integration)
5. [Bluetooth Integration](#bluetooth-integration)
6. [ESP32 / Arduino Integration](#esp32--arduino-integration)
7. [Industrial API Integration](#industrial-api-integration)
8. [Backend Machine Layer](#backend-machine-layer)
9. [Frontend Real-Time Display](#frontend-real-time-display)
10. [Data Flow Diagram](#data-flow-diagram)
11. [Security Considerations](#security-considerations)
12. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

SmartLoad AI implements a **modular, hardware-agnostic weighing machine integration layer** designed to support multiple connection methods through a unified abstraction. The architecture follows the **Adapter Pattern**, allowing new device types to be added without modifying existing code.

```
┌─────────────────────────────────────────────────────────────┐
│                    WEIGHING MACHINE LAYER                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   USB    │  │ Bluetooth│  │  Serial  │  │   API    │  │
│  │  (HID)   │  │  (BLE)   │  │  (RS232) │  │ (REST)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │             │          │
│  ┌────┴─────────────┴─────────────┴─────────────┴─────┐   │
│  │              Unified Machine Adapter                 │   │
│  │         (Normalizes all weight readings)             │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              SOCKET.IO REAL-TIME STREAM                      │
│         (Broadcasts weight to authenticated clients)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Supported Devices & Protocols

| Connection Type | Protocol | Hardware Examples | Use Case |
|----------------|----------|-------------------|----------|
| **USB HID** | USB Human Interface Device | DYMO M25, Fairbanks, Rice Lake | Desktop workstations |
| **Serial (RS232)** | RS-232 / RS-485 | Mettler Toledo, Ohaus, A&D | Industrial scales, legacy equipment |
| **Bluetooth (BLE)** | Bluetooth Low Energy | KERN, Adam Equipment wireless scales | Mobile/portable setups |
| **ESP32/Arduino** | WiFi / Serial | Custom HX711 + ESP32 builds | Low-cost IoT deployments |
| **Industrial API** | REST / MQTT / Modbus | METTLER TOLEDO IND890, Bizerba | Enterprise integrations |
| **Web Serial API** | Browser-native serial | Chrome/Edge compatible scales | Browser-direct connections |

---

## Integration Architecture

### 1. Machine Status Model

The `MachineStatus` MongoDB schema tracks every connected device:

```javascript
// backend/models/MachineStatus.js
const machineStatusSchema = new mongoose.Schema({
  deviceId:       { type: String, required: true, unique: true },   // e.g., "usb-046d-c52b"
  deviceType:     { type: String, enum: ['usb','bluetooth','serial','esp32','arduino','api'] },
  deviceName:     { type: String, required: true },                  // e.g., "Fairbanks 70-2453"
  status:         { type: String, enum: ['connected','disconnected','error'], default: 'disconnected' },
  lastConnected:  { type: Date },
  lastWeight:     { type: Number, default: 0 },
  port:           { type: String },                                  // COM3, /dev/ttyUSB0
  baudRate:       { type: Number },                                // 9600, 115200
  ipAddress:      { type: String },                                // For ESP32/API devices
  isActive:       { type: Boolean, default: false },
  createdBy:      { type: ObjectId, ref: 'User', required: true }
}, { timestamps: true });
```

### 2. Weight Log Schema

Every weight reading is persisted with full traceability:

```javascript
// backend/models/WeightLog.js
const weightLogSchema = new mongoose.Schema({
  vehicle:          { type: ObjectId, ref: 'Vehicle', required: true },
  vehicleNumber:    { type: String, required: true },
  weight:           { type: Number, required: true },              // in kg
  entryType:        { type: String, enum: ['simulation','machine','manual'] },
  cargoType:        { type: String },
  deviceId:         { type: String },                              // Links to MachineStatus
  deviceType:       { type: String, enum: ['usb','bluetooth','serial','esp32','arduino','api'] },
  isOverload:       { type: Boolean, default: false },
  overloadPercentage:{ type: Number, default: 0 },
  createdBy:        { type: ObjectId, ref: 'User', required: true }
}, { timestamps: true });
```

---

## USB / Serial Port Integration

### Hardware Connection

```
┌─────────────────┐      USB Cable / RS232      ┌─────────────────┐
│  Weighing Scale │◄───────────────────────────►│  PC / Server    │
│  (USB HID or    │      (FTDI adapter for      │  (Node.js +      │
│   RS232 output) │       serial-to-USB)         │   serialport)   │
└─────────────────┘                              └─────────────────┘
```

### Node.js Implementation (Serial)

```javascript
// backend/services/machineDrivers/serialDriver.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class SerialScaleDriver {
  constructor(config) {
    this.port = new SerialPort({
      path: config.port,        // e.g., 'COM3' or '/dev/ttyUSB0'
      baudRate: config.baudRate || 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    });
    this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    this.onWeight = null;
  }

  connect() {
    this.parser.on('data', (line) => {
      // Parse weight from scale output
      // Format varies: "  12.50 kg", "ST,GS,   45.2", "+00045.2"
      const weight = this.parseWeight(line);
      if (weight !== null && this.onWeight) {
        this.onWeight({
          weight: weight,
          unit: 'kg',
          raw: line,
          timestamp: new Date()
        });
      }
    });

    this.port.on('error', (err) => {
      console.error('Serial port error:', err);
      // Emit disconnect alert
    });
  }

  parseWeight(rawLine) {
    // Common patterns:
    // "  123.45 kg"  → extract 123.45
    // "ST,NT,+123.4" → extract 123.4
    // "W+00045.2"    → extract 45.2
    const patterns = [
      /([+-]?\d+\.?\d*)\s*kg/i,
      /([+-]?\d+\.?\d*)/,
    ];

    for (const pattern of patterns) {
      const match = rawLine.match(pattern);
      if (match) return parseFloat(match[1]);
    }
    return null;
  }

  disconnect() {
    this.port.close();
  }
}

module.exports = SerialScaleDriver;
```

### Web Serial API (Browser-Direct)

For modern browsers (Chrome 89+, Edge 89+):

```javascript
// frontend/src/services/webSerial.js
export class WebSerialService {
  constructor() {
    this.port = null;
    this.reader = null;
    this.onWeight = null;
  }

  async requestPort() {
    // User selects device from browser picker
    this.port = await navigator.serial.requestPort({
      filters: [
        { usbVendorId: 0x067b }, // Prolific
        { usbVendorId: 0x0403 }, // FTDI
      ]
    });
    await this.port.open({ baudRate: 9600 });
    this.readLoop();
  }

  async readLoop() {
    const decoder = new TextDecoderStream();
    const inputDone = this.port.readable.pipeTo(decoder.writable);
    const inputStream = decoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer()));
    const reader = inputStream.getReader();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const weight = this.parseWeight(value);
      if (weight && this.onWeight) {
        this.onWeight(weight);
      }
    }
  }

  parseWeight(line) {
    const match = line.match(/([+-]?\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  }

  async disconnect() {
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }
}
```

---

## Bluetooth Integration

### BLE (Bluetooth Low Energy) Architecture

```
┌─────────────────┐      BLE GATT      ┌─────────────────┐
│  Wireless Scale │◄─────Services─────►│  PC/Phone/Tablet │
│  (KERN, Adam)   │   Weight Service   │  (Web Bluetooth  │
│                 │   Characteristic   │   or Noble.js)   │
└─────────────────┘                    └─────────────────┘
```

### Node.js Noble.js Implementation

```javascript
// backend/services/machineDrivers/bluetoothDriver.js
const noble = require('@abandonware/noble');

const WEIGHT_SERVICE_UUID = '181d';      // Standard Weight Scale Service
const WEIGHT_CHAR_UUID = '2a9d';         // Weight Measurement Characteristic

class BluetoothScaleDriver {
  constructor() {
    this.peripheral = null;
    this.characteristic = null;
    this.onWeight = null;
  }

  async scanAndConnect() {
    return new Promise((resolve, reject) => {
      noble.on('stateChange', (state) => {
        if (state === 'poweredOn') {
          noble.startScanning([WEIGHT_SERVICE_UUID], false);
        }
      });

      noble.on('discover', async (peripheral) => {
        console.log('Found scale:', peripheral.advertisement.localName);
        noble.stopScanning();

        await peripheral.connectAsync();
        this.peripheral = peripheral;

        const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
          [WEIGHT_SERVICE_UUID],
          [WEIGHT_CHAR_UUID]
        );

        this.characteristic = characteristics[0];
        this.characteristic.on('data', (data) => {
          // Parse BLE weight data packet
          // Flags (1 byte) + Weight (4 bytes, IEEE-11073 float)
          const flags = data.readUInt8(0);
          const weight = data.readFloatLE(1); // Simplified
          const unit = (flags & 0x01) ? 'lb' : 'kg';

          if (this.onWeight) {
            this.onWeight({ weight, unit, timestamp: new Date() });
          }
        });

        await this.characteristic.subscribeAsync();
        resolve();
      });

      setTimeout(() => reject(new Error('Scan timeout')), 30000);
    });
  }

  disconnect() {
    if (this.peripheral) {
      this.peripheral.disconnect();
    }
  }
}

module.exports = BluetoothScaleDriver;
```

### Web Bluetooth API (Browser)

```javascript
// frontend/src/services/webBluetooth.js
export class WebBluetoothService {
  async connect() {
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['weight_scale'] }],
      optionalServices: ['battery_service']
    });

    const server = await this.device.gatt.connect();
    const service = await server.getPrimaryService('weight_scale');
    this.characteristic = await service.getCharacteristic('weight_measurement');

    await this.characteristic.startNotifications();
    this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = event.target.value;
      const weight = value.getFloat32(1, true); // little-endian
      this.onWeight?.(weight);
    });
  }
}
```

---

## ESP32 / Arduino Integration

### ESP32 + HX711 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ESP32 MICROCONTROLLER                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   HX711     │    │   WiFi      │    │   HTTP/     │     │
│  │  Load Cell  │───►│  Module     │───►│  WebSocket  │────►│
│  │   ADC       │    │             │    │   Server    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         ▲                                                    │
│    ┌────┴────┐                                               │
│    │ Load    │                                               │
│    │ Cell    │                                               │
│    │ (50kg)  │                                               │
│    └─────────┘                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  SmartLoad AI     │
                    │  Backend Server   │
                    └─────────────────┘
```

### ESP32 Arduino Code (HX711)

```cpp
// firmware/esp32-weighing-scale.ino
#include <WiFi.h>
#include <HTTPClient.h>
#include <HX711.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "http://your-server:5000/api/weights/machine";
const char* DEVICE_ID = "esp32-scale-001";
const char* API_TOKEN = "YOUR_JWT_TOKEN";

// HX711 pins
#define LOADCELL_DOUT_PIN  16
#define LOADCELL_SCK_PIN   4

HX711 scale;

void setup() {
  Serial.begin(115200);

  // Initialize HX711
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(2280.f);  // Calibration factor
  scale.tare();             // Zero the scale

  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");
}

void loop() {
  if (scale.is_ready()) {
    float weight = scale.get_units(5);  // Average 5 readings

    if (weight > 0.5) {  // Minimum threshold
      sendWeight(weight);
    }
  }

  delay(2000);  // Send every 2 seconds
}

void sendWeight(float weight) {
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(API_TOKEN));

  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"weight\":" + String(weight, 2) + ",";
  payload += "\"vehicleId\":\"VEHICLE_ID_HERE\",";
  payload += "\"deviceType\":\"esp32\"";
  payload += "}";

  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    Serial.println("Weight sent: " + String(weight, 2) + " kg");
  } else {
    Serial.println("Error: " + String(httpCode));
  }

  http.end();
}
```

### ESP32 WebSocket (Real-Time)

```cpp
// Alternative: WebSocket for real-time streaming
#include <WebSocketsClient.h>

WebSocketsClient webSocket;

void setupWebSocket() {
  webSocket.begin("your-server.com", 5000, "/socket.io/?EIO=4&transport=websocket");
  webSocket.onEvent(webSocketEvent);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket disconnected!");
      break;
    case WStype_CONNECTED:
      Serial.println("WebSocket connected!");
      // Join user room
      webSocket.sendTXT("{\"event\":\"join_user_room\",\"userId\":\"USER_ID\"}");
      break;
  }
}

void sendWeightWS(float weight) {
  String msg = "{\"event\":\"machine_weight\",\"weight\":" + String(weight, 2) + 
               ",\"deviceId\":\"esp32-scale-001\",\"userId\":\"USER_ID\"}";
  webSocket.sendTXT(msg);
}
```

---

## Industrial API Integration

### REST API Webhook Pattern

```javascript
// backend/services/machineDrivers/apiDriver.js
class IndustrialAPIDriver {
  constructor(config) {
    this.endpoint = config.endpoint;      // e.g., "http://scale.local/api/weight"
    this.apiKey = config.apiKey;
    this.pollInterval = config.pollInterval || 2000;
    this.onWeight = null;
    this.intervalId = null;
  }

  startPolling() {
    this.intervalId = setInterval(async () => {
      try {
        const response = await fetch(this.endpoint, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });
        const data = await response.json();

        if (data.weight && this.onWeight) {
          this.onWeight({
            weight: parseFloat(data.weight),
            unit: data.unit || 'kg',
            timestamp: new Date(),
            metadata: data
          });
        }
      } catch (error) {
        console.error('API poll error:', error);
      }
    }, this.pollInterval);
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

module.exports = IndustrialAPIDriver;
```

### MQTT Integration (IoT Scales)

```javascript
// backend/services/machineDrivers/mqttDriver.js
const mqtt = require('mqtt');

class MQTTScaleDriver {
  constructor(config) {
    this.client = mqtt.connect(config.broker, {
      username: config.username,
      password: config.password,
      clientId: `smartload-${Date.now()}`
    });
    this.topic = config.topic;  // e.g., "scale/001/weight"
    this.onWeight = null;
  }

  connect() {
    this.client.on('connect', () => {
      console.log('MQTT connected');
      this.client.subscribe(this.topic);
    });

    this.client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        if (this.onWeight) {
          this.onWeight({
            weight: parseFloat(data.weight),
            unit: data.unit || 'kg',
            timestamp: new Date(),
            raw: data
          });
        }
      } catch (e) {
        console.error('MQTT parse error:', e);
      }
    });
  }

  disconnect() {
    this.client.end();
  }
}

module.exports = MQTTScaleDriver;
```

---

## Backend Machine Layer

### Unified Machine Service

```javascript
// backend/services/machineService.js
const SerialScaleDriver = require('./machineDrivers/serialDriver');
const BluetoothScaleDriver = require('./machineDrivers/bluetoothDriver');
const IndustrialAPIDriver = require('./machineDrivers/apiDriver');
const MQTTScaleDriver = require('./machineDrivers/mqttDriver');
const WeightLog = require('../models/WeightLog');
const Alert = require('../models/Alert');
const AIEngine = require('../utils/aiEngine');
const { getIO } = require('../sockets/socketManager');

class MachineService {
  constructor() {
    this.drivers = new Map();  // deviceId -> driver instance
  }

  async connectDevice(config) {
    let driver;

    switch (config.deviceType) {
      case 'serial':
        driver = new SerialScaleDriver(config);
        break;
      case 'bluetooth':
        driver = new BluetoothScaleDriver(config);
        break;
      case 'api':
        driver = new IndustrialAPIDriver(config);
        break;
      case 'mqtt':
        driver = new MQTTScaleDriver(config);
        break;
      default:
        throw new Error(`Unsupported device type: ${config.deviceType}`);
    }

    // Set up weight callback
    driver.onWeight = async (reading) => {
      await this.processWeightReading(config.deviceId, config.vehicleId, reading);
    };

    // Connect based on type
    if (config.deviceType === 'serial') driver.connect();
    else if (config.deviceType === 'bluetooth') await driver.scanAndConnect();
    else if (config.deviceType === 'api') driver.startPolling();
    else if (config.deviceType === 'mqtt') driver.connect();

    this.drivers.set(config.deviceId, driver);

    // Update machine status
    await MachineStatus.findOneAndUpdate(
      { deviceId: config.deviceId },
      { status: 'connected', lastConnected: new Date(), isActive: true },
      { upsert: true }
    );

    return driver;
  }

  async processWeightReading(deviceId, vehicleId, reading) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return;

    // Convert to kg if needed
    const weightKg = reading.unit === 'lb' ? reading.weight * 0.453592 : reading.weight;

    // AI Checks
    const overloadCheck = AIEngine.detectOverload(weightKg, vehicle.capacity);
    const fraudCheck = AIEngine.detectFraud(weightKg, vehicle.currentWeight);

    // Save weight log
    const weightLog = new WeightLog({
      vehicle: vehicleId,
      vehicleNumber: vehicle.vehicleNumber,
      weight: weightKg,
      entryType: 'machine',
      deviceId: deviceId,
      deviceType: reading.deviceType || 'serial',
      isOverload: overloadCheck.isOverload,
      overloadPercentage: overloadCheck.percentage,
      createdBy: vehicle.createdBy
    });
    await weightLog.save();

    // Update vehicle
    vehicle.currentWeight = weightKg;
    await vehicle.save();

    // Create alert if overload
    if (overloadCheck.isOverload) {
      await Alert.create({
        type: 'overload',
        severity: overloadCheck.severity,
        title: 'Machine: Vehicle Overload Detected',
        message: `Vehicle ${vehicle.vehicleNumber} overloaded by ${overloadCheck.percentage}%`,
        vehicle: vehicleId,
        vehicleNumber: vehicle.vehicleNumber,
        createdFor: vehicle.createdBy,
        metadata: { ...overloadCheck, deviceId }
      });
    }

    // Real-time broadcast
    const io = getIO();
    io.to(`user_${vehicle.createdBy}`).emit('weight_update', {
      vehicleId,
      weight: weightKg,
      entryType: 'machine',
      deviceId,
      timestamp: new Date(),
      overload: overloadCheck,
      fraud: fraudCheck
    });

    // Update machine status
    await MachineStatus.findOneAndUpdate(
      { deviceId },
      { lastWeight: weightKg, lastConnected: new Date() }
    );
  }

  async disconnectDevice(deviceId) {
    const driver = this.drivers.get(deviceId);
    if (driver) {
      driver.disconnect?.() || driver.stopPolling?.() || driver.disconnect?.();
      this.drivers.delete(deviceId);
    }

    await MachineStatus.findOneAndUpdate(
      { deviceId },
      { status: 'disconnected', isActive: false }
    );

    // Create disconnect alert
    const machine = await MachineStatus.findOne({ deviceId });
    if (machine) {
      await Alert.create({
        type: 'machine_disconnected',
        severity: 'medium',
        title: 'Weighing Machine Disconnected',
        message: `Device ${machine.deviceName} has been disconnected`,
        createdFor: machine.createdBy
      });
    }
  }
}

module.exports = new MachineService();
```

---

## Frontend Real-Time Display

### React Hook for Machine Connection

```javascript
// frontend/src/hooks/useMachineConnection.js
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export const useMachineConnection = (vehicleId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [overload, setOverload] = useState(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('machine_weight_update', (data) => {
      setCurrentWeight(data.weight);
      setIsConnected(true);
    });

    socket.on('weight_update', (data) => {
      if (data.entryType === 'machine') {
        setCurrentWeight(data.weight);
        setOverload(data.overload);
        setIsConnected(true);
      }
    });

    socket.on('machine_disconnected', () => {
      setIsConnected(false);
    });

    return () => {
      socket.off('machine_weight_update');
      socket.off('weight_update');
      socket.off('machine_disconnected');
    };
  }, [socket]);

  const connectMachine = useCallback(async (deviceConfig) => {
    // API call to backend to initiate connection
    const res = await api.post('/machines/connect', {
      ...deviceConfig,
      vehicleId
    });
    setDeviceInfo(res.data);
    setIsConnected(true);
  }, [vehicleId]);

  const disconnectMachine = useCallback(async () => {
    if (deviceInfo) {
      await api.post('/machines/disconnect', { deviceId: deviceInfo.deviceId });
      setIsConnected(false);
      setDeviceInfo(null);
    }
  }, [deviceInfo]);

  return { isConnected, currentWeight, deviceInfo, overload, connectMachine, disconnectMachine };
};
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE DATA FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │ Load Cell    │
  │ (Physical)   │
  └──────┬───────┘
         │ Analog signal
         ▼
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   HX711      │────►│   ESP32      │────►│   WiFi/      │
  │   ADC        │     │  (Process)   │     │   Bluetooth  │
  └──────────────┘     └──────────────┘     └──────┬───────┘
                                                    │
         ┌──────────────────────────────────────────┘
         │ HTTP POST / WebSocket / MQTT
         ▼
  ┌──────────────────────────────────────────────────────┐
  │              SmartLoad AI Backend                     │
  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
  │  │   Auth      │  │  Machine    │  │    AI       │   │
  │  │ Middleware  │  │  Service    │  │   Engine    │   │
  │  └─────────────┘  └──────┬──────┘  └──────┬──────┘   │
  │                          │                │          │
  │  ┌─────────────┐  ┌──────┴──────┐  ┌──────┴──────┐   │
  │  │  WeightLog  │  │   Alert     │  │  Vehicle    │   │
  │  │   (Save)    │  │  (Create)   │  │  (Update)   │   │
  │  └─────────────┘  └─────────────┘  └─────────────┘   │
  │                          │                           │
  │                   ┌──────┴──────┐                    │
  │                   │  Socket.io  │                    │
  │                   │  Broadcast  │                    │
  │                   └──────┬──────┘                    │
  └──────────────────────────┼───────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │  Dashboard   │   │ Live Weighing│   │  Alert Bell  │
  │   (Chart)    │   │  (Big Display)│   │  (Badge +1)  │
  └──────────────┘   └──────────────┘   └──────────────┘
```

---

## Security Considerations

| Layer | Measure |
|-------|---------|
| **Device Authentication** | Each machine has unique `deviceId` + API key |
| **JWT Validation** | All machine endpoints require valid Bearer token |
| **Rate Limiting** | Max 100 weight readings/minute per device |
| **Input Sanitization** | Weight values validated: `0 < weight < 100,000` kg |
| **HTTPS/WSS** | All communications encrypted in production |
| **Device Whitelist** | Only pre-registered devices can connect |
| **Audit Trail** | Every reading logged with deviceId, timestamp, user |

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Cannot find module 'serialport'" | Native dependency not built | `npm install --build-from-source` |
| Scale shows random numbers | Wrong baud rate | Check scale manual, try 9600/19200/115200 |
| BLE won't connect | Windows Bluetooth stack | Use Linux/Mac or Zadig driver replacement |
| ESP32 sends 0 weight | HX711 not calibrated | Run calibration sketch first |
| Weight drifts over time | Temperature/load cell creep | Implement auto-tare between readings |
| Web Serial not available | Wrong browser | Use Chrome 89+ or Edge 89+ |
| MQTT connection refused | Firewall/ACL | Whitelist server IP in broker config |

---

## Calibration Procedure

### Step 1: Zero (Tare)
```cpp
scale.tare();  // Reset to zero with no load
```

### Step 2: Known Weight Calibration
```cpp
// Place known weight (e.g., 5kg) on scale
float knownWeight = 5.0;  // kg
float rawReading = scale.get_units(10);
float calibrationFactor = rawReading / knownWeight;
scale.set_scale(calibrationFactor);

// Save to EEPROM for persistence
EEPROM.put(0, calibrationFactor);
```

### Step 3: Verify
```cpp
float testWeight = scale.get_units(5);
Serial.println("Test weight: " + String(testWeight) + " kg");
// Should read approximately 5.00 kg
```

---

*Document Version: 1.0 | SmartLoad AI Platform*
