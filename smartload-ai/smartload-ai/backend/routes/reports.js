const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

router.get('/shipments', auth, reportController.generateShipmentReport);
router.get('/vehicles', auth, reportController.generateVehicleReport);
router.get('/weight-logs', auth, reportController.generateWeightLogReport);

module.exports = router;