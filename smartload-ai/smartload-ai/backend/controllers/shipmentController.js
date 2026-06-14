//# backend/controllers/shipmentController.js
const Shipment = require('../models/Shipment');
const Vehicle = require('../models/Vehicle');
const AIEngine = require('../utils/aiEngine');
const Alert = require('../models/Alert');

exports.createShipment = async (req, res) => {
  try {
    const shipmentId = `SHP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const shipment = new Shipment({
      ...req.body,
      shipmentId,
      vehicleNumber: vehicle.vehicleNumber,
      createdBy: req.user.id
    });

    // AI Risk Assessment
    const weightLog = await WeightLog.findOne({ vehicle: vehicle._id }).sort({ createdAt: -1 });
    const riskAssessment = AIEngine.calculateRiskScore(shipment, vehicle, weightLog);
    shipment.riskScore = riskAssessment.score;

    await shipment.save();

    // Generate AI recommendations
    const recommendations = AIEngine.generateRecommendations(vehicle, shipment, weightLog);
    shipment.aiRecommendations = recommendations.map(r => r.message);
    await shipment.save();

    // Create alerts for high risk
    if (riskAssessment.level === 'high') {
      await Alert.create({
        type: 'high_risk',
        severity: 'high',
        title: 'High Risk Shipment Detected',
        message: `Shipment ${shipmentId} has a risk score of ${riskAssessment.score}`,
        vehicle: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        shipment: shipment._id,
        createdFor: req.user.id,
        metadata: riskAssessment
      });
    }

    res.status(201).json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getShipments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, vehicle, search } = req.query;
    const query = { createdBy: req.user.id };

    if (status) query.status = status;
    if (vehicle) query.vehicle = vehicle;
    if (search) {
      query.$or = [
        { shipmentId: { $regex: search, $options: 'i' } },
        { cargoType: { $regex: search, $options: 'i' } }
      ];
    }

    const shipments = await Shipment.find(query)
      .populate('vehicle', 'vehicleNumber driverName capacity')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Shipment.countDocuments(query);

    res.json({
      shipments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, createdBy: req.user.id })
      .populate('vehicle');
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true }
    ).populate('vehicle');
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json({ message: 'Shipment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};