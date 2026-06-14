//# backend/controllers/weightController.js
const WeightLog = require('../models/WeightLog');
const Vehicle = require('../models/Vehicle');
const Alert = require('../models/Alert');
const AIEngine = require('../utils/aiEngine');
const { getIO } = require('../sockets/socketManager');

// Simulation mode - generates realistic weights
exports.startSimulation = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const vehicle = await Vehicle.findOne({ _id: vehicleId, createdBy: req.user.id });
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Generate realistic base weight with small variations
    const baseWeight = Math.floor(Math.random() * 500) + 500; // 500-1000kg base
    const variation = () => Math.floor(Math.random() * 10) - 5; // ±5kg variation
    
    const weight = baseWeight + variation();

    const weightLog = new WeightLog({
      vehicle: vehicle._id,
      vehicleNumber: vehicle.vehicleNumber,
      weight,
      entryType: 'simulation',
      cargoType: 'Mixed Cargo',
      createdBy: req.user.id
    });

    await weightLog.save();

    // Check for overload
    const overloadCheck = AIEngine.detectOverload(weight, vehicle.capacity);
    if (overloadCheck.isOverload) {
      weightLog.isOverload = true;
      weightLog.overloadPercentage = overloadCheck.percentage;
      await weightLog.save();

      await Alert.create({
        type: 'overload',
        severity: overloadCheck.severity,
        title: 'Vehicle Overload Detected',
        message: `Vehicle ${vehicle.vehicleNumber} is overloaded by ${overloadCheck.percentage}%`,
        vehicle: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        createdFor: req.user.id,
        metadata: overloadCheck
      });
    }

    // Update vehicle current weight
    vehicle.currentWeight = weight;
    await vehicle.save();

    // Emit realtime update
    const io = getIO();
    io.to(`user_${req.user.id}`).emit('weight_update', {
      vehicleId: vehicle._id,
      weight,
      entryType: 'simulation',
      timestamp: new Date(),
      overload: overloadCheck
    });

    res.json({ weightLog, overload: overloadCheck });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Machine integration - receive weight from hardware
exports.receiveMachineWeight = async (req, res) => {
  try {
    const { deviceId, weight, vehicleId } = req.body;
    
    const vehicle = await Vehicle.findOne({ _id: vehicleId, createdBy: req.user.id });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const weightLog = new WeightLog({
      vehicle: vehicle._id,
      vehicleNumber: vehicle.vehicleNumber,
      weight,
      entryType: 'machine',
      deviceId,
      cargoType: req.body.cargoType || 'Unknown',
      createdBy: req.user.id
    });

    await weightLog.save();

    // AI checks
    const overloadCheck = AIEngine.detectOverload(weight, vehicle.capacity);
    const fraudCheck = AIEngine.detectFraud(weight, req.body.expectedWeight);

    if (overloadCheck.isOverload) {
      weightLog.isOverload = true;
      weightLog.overloadPercentage = overloadCheck.percentage;
      await weightLog.save();
    }

    vehicle.currentWeight = weight;
    await vehicle.save();

    // Realtime emit
    const io = getIO();
    io.to(`user_${req.user.id}`).emit('weight_update', {
      vehicleId: vehicle._id,
      weight,
      entryType: 'machine',
      deviceId,
      timestamp: new Date(),
      overload: overloadCheck,
      fraud: fraudCheck
    });

    res.json({ weightLog, overload: overloadCheck, fraud: fraudCheck });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manual weight entry
exports.createManualEntry = async (req, res) => {
  try {
    const { vehicleNumber, driverName, cargoType, weight, buyer, seller, location, notes } = req.body;

    let vehicle = await Vehicle.findOne({ vehicleNumber, createdBy: req.user.id });
    
    // Create vehicle if doesn't exist
    if (!vehicle) {
      vehicle = new Vehicle({
        vehicleNumber,
        driverName: driverName || 'Unknown',
        driverPhone: 'N/A',
        vehicleType: 'truck',
        capacity: 5000,
        licenseNumber: 'PENDING',
        createdBy: req.user.id
      });
      await vehicle.save();
    }

    const weightLog = new WeightLog({
      vehicle: vehicle._id,
      vehicleNumber,
      weight,
      entryType: 'manual',
      cargoType,
      buyer,
      seller,
      location,
      notes,
      createdBy: req.user.id
    });

    await weightLog.save();

    // Update vehicle
    vehicle.currentWeight = weight;
    vehicle.driverName = driverName || vehicle.driverName;
    await vehicle.save();

    // Realtime update
    const io = getIO();
    io.to(`user_${req.user.id}`).emit('weight_update', {
      vehicleId: vehicle._id,
      weight,
      entryType: 'manual',
      timestamp: new Date()
    });

    res.status(201).json(weightLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWeightLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, vehicle, entryType, startDate, endDate } = req.query;
    const query = { createdBy: req.user.id };

    if (vehicle) query.vehicle = vehicle;
    if (entryType) query.entryType = entryType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await WeightLog.find(query)
      .populate('vehicle', 'vehicleNumber driverName capacity')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await WeightLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWeightStats = async (req, res) => {
  try {
    const stats = await WeightLog.aggregate([
      { $match: { createdBy: req.user._id } },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalWeight: { $sum: '$weight' },
          averageWeight: { $avg: '$weight' },
          maxWeight: { $max: '$weight' },
          minWeight: { $min: '$weight' }
        }
      }
    ]);

    const entryTypeBreakdown = await WeightLog.aggregate([
      { $match: { createdBy: req.user._id } },
      { $group: { _id: '$entryType', count: { $sum: 1 }, totalWeight: { $sum: '$weight' } } }
    ]);

    res.json({
      overall: stats[0] || {},
      byEntryType: entryTypeBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};