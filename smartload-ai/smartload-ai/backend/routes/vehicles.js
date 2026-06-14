const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const vehicleController = require('../controllers/vehicleController');
const { auth } = require('../middleware/auth');

router.post('/', auth, [
  body('vehicleNumber').trim().notEmpty(),
  body('driverName').trim().notEmpty(),
  body('driverPhone').trim().notEmpty(),
  body('vehicleType').isIn(['truck', 'van', 'container', 'trailer', 'pickup']),
  body('capacity').isFloat({ min: 0 }),
  body('licenseNumber').trim().notEmpty()
], vehicleController.createVehicle);

router.get('/', auth, vehicleController.getVehicles);
router.get('/stats', auth, vehicleController.getVehicleStats);
router.get('/:id', auth, vehicleController.getVehicleById);
router.put('/:id', auth, vehicleController.updateVehicle);
router.delete('/:id', auth, vehicleController.deleteVehicle);

module.exports = router;