const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { auth } = require('../middleware/auth');

router.get('/', auth, alertController.getAlerts);
router.get('/stats', auth, alertController.getAlertStats);
router.patch('/:id/resolve', auth, alertController.resolveAlert);

module.exports = router;