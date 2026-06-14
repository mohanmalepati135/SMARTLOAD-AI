const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const weightController = require('../controllers/weightController');
const { auth } = require('../middleware/auth');

router.post('/simulation', auth, [
  body('vehicleId').notEmpty()
], weightController.startSimulation);

router.post('/machine', auth, [
  body('deviceId').trim().notEmpty(),
  body('weight').isFloat({ min: 0 }),
  body('vehicleId').notEmpty()
], weightController.receiveMachineWeight);

router.post('/manual', auth, [
  body('vehicleNumber').trim().notEmpty(),
  body('weight').isFloat({ min: 0 })
], weightController.createManualEntry);

router.get('/logs', auth, weightController.getWeightLogs);
router.get('/stats', auth, weightController.getWeightStats);

module.exports = router;