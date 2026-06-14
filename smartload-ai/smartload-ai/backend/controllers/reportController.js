const Shipment = require('../models/Shipment');
const Vehicle = require('../models/Vehicle');
const WeightLog = require('../models/WeightLog');
const { Parser } = require('@json2csv/plainjs');
const puppeteer = require('puppeteer');

exports.generateShipmentReport = async (req, res) => {
  try {
    const { format = 'json', startDate, endDate, status } = req.query;
    const query = { createdBy: req.user.id };
    if (startDate || endDate) { query.createdAt = {}; if (startDate) query.createdAt.$gte = new Date(startDate); if (endDate) query.createdAt.$lte = new Date(endDate); }
    if (status) query.status = status;
    const shipments = await Shipment.find(query).populate('vehicle', 'vehicleNumber driverName').sort({ createdAt: -1 });
    if (format === 'csv') {
      const opts = { fields: ['shipmentId', 'cargoType', 'buyer', 'seller', 'origin', 'destination', 'vehicleNumber', 'weight', 'status', 'revenue', 'shipmentDate', 'createdAt'] };
      const parser = new Parser(opts);
      const csv = parser.parse(shipments.map(s => ({ ...s.toObject(), vehicleNumber: s.vehicle?.vehicleNumber || 'N/A' })));
      res.header('Content-Type', 'text/csv'); res.attachment('shipments-report.csv'); return res.send(csv);
    }
    if (format === 'pdf') {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      const html = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;margin:40px}h1{color:#4F46E5}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #E5E7EB;padding:12px;text-align:left}th{background:linear-gradient(135deg,#4F46E5,#2563EB);color:white}tr:nth-child(even){background:#F8FAFC}.status-delivered{color:#10B981;font-weight:bold}.status-pending{color:#F59E0B;font-weight:bold}.status-in_transit{color:#2563EB;font-weight:bold}</style></head><body><h1>SmartLoad AI - Shipment Report</h1><p>Generated on: ${new Date().toLocaleString()}</p><table><tr><th>Shipment ID</th><th>Cargo Type</th><th>Origin</th><th>Destination</th><th>Vehicle</th><th>Weight (kg)</th><th>Revenue</th><th>Status</th></tr>${shipments.map(s => `<tr><td>${s.shipmentId}</td><td>${s.cargoType}</td><td>${s.origin}</td><td>${s.destination}</td><td>${s.vehicle?.vehicleNumber || 'N/A'}</td><td>${s.weight}</td><td>$${s.revenue}</td><td class="status-${s.status}">${s.status}</td></tr>`).join('')}</table></body></html>`;
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      res.header('Content-Type', 'application/pdf'); res.attachment('shipments-report.pdf'); return res.send(pdf);
    }
    res.json({ shipments, total: shipments.length });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.generateVehicleReport = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const vehicles = await Vehicle.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    if (format === 'csv') {
      const opts = { fields: ['vehicleNumber', 'driverName', 'driverPhone', 'vehicleType', 'capacity', 'currentWeight', 'status', 'totalTrips', 'createdAt'] };
      const parser = new Parser(opts);
      const csv = parser.parse(vehicles);
      res.header('Content-Type', 'text/csv'); res.attachment('vehicles-report.csv'); return res.send(csv);
    }
    res.json({ vehicles, total: vehicles.length });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.generateWeightLogReport = async (req, res) => {
  try {
    const { format = 'json', entryType, startDate, endDate } = req.query;
    const query = { createdBy: req.user.id };
    if (entryType) query.entryType = entryType;
    if (startDate || endDate) { query.createdAt = {}; if (startDate) query.createdAt.$gte = new Date(startDate); if (endDate) query.createdAt.$lte = new Date(endDate); }
    const logs = await WeightLog.find(query).populate('vehicle', 'vehicleNumber').sort({ createdAt: -1 });
    if (format === 'csv') {
      const opts = { fields: ['vehicleNumber', 'weight', 'entryType', 'cargoType', 'buyer', 'seller', 'location', 'isOverload', 'overloadPercentage', 'createdAt'] };
      const parser = new Parser(opts);
      const csv = parser.parse(logs.map(l => ({ ...l.toObject(), vehicleNumber: l.vehicle?.vehicleNumber || 'N/A' })));
      res.header('Content-Type', 'text/csv'); res.attachment('weight-logs-report.csv'); return res.send(csv);
    }
    res.json({ logs, total: logs.length });
  } catch (error) { res.status(500).json({ message: error.message }); }
};