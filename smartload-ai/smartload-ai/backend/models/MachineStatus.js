const mongoose = require('mongoose');

const machineStatusSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  deviceType: { type: String, enum: ['usb', 'bluetooth', 'serial', 'esp32', 'arduino', 'api'], required: true },
  deviceName: { type: String, required: true },
  status: { type: String, enum: ['connected', 'disconnected', 'error'], default: 'disconnected' },
  lastConnected: { type: Date },
  lastWeight: { type: Number, default: 0 },
  port: { type: String },
  baudRate: { type: Number },
  ipAddress: { type: String },
  isActive: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('MachineStatus', machineStatusSchema);