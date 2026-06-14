
const Vehicle = require('../models/Vehicle');
const WeightLog = require('../models/WeightLog');

exports.createVehicle = async (req, res) => {
  try {
    const vehicle = new Vehicle({
      ...req.body,
      createdBy: req.user.id
    });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, sortBy = 'createdAt' } = req.query;
    const query = { createdBy: req.user.id };

    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;

    const vehicles = await Vehicle.find(query)
      .sort({ [sortBy]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Vehicle.countDocuments(query);

    res.json({
      vehicles,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const recentLogs = await WeightLog.find({ vehicle: vehicle._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ vehicle, recentLogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVehicleStats = async (req, res) => {
  try {
    const stats = await Vehicle.aggregate([
      { $match: { createdBy: req.user._id } },
      {
        $group: {
          _id: null,
          totalVehicles: { $sum: 1 },
          activeVehicles: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalCapacity: { $sum: '$capacity' },
          avgCapacity: { $avg: '$capacity' }
        }
      }
    ]);

    res.json(stats[0] || { totalVehicles: 0, activeVehicles: 0, totalCapacity: 0, avgCapacity: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};