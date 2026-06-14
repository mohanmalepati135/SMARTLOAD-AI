const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const shipmentController = require('../controllers/shipmentController');
const { auth } = require('../middleware/auth');

router.post('/', auth, [
  body('cargoType').trim().notEmpty(),
  body('buyer').trim().notEmpty(),
  body('seller').trim().notEmpty(),
  body('origin').trim().notEmpty(),
  body('destination').trim().notEmpty(),
  body('vehicle').notEmpty(),
  body('shipmentDate').isISO8601()
], shipmentController.createShipment);

router.get('/', auth, shipmentController.getShipments);
router.get('/:id', auth, shipmentController.getShipmentById);
router.put('/:id', auth, shipmentController.updateShipment);
router.delete('/:id', auth, shipmentController.deleteShipment);

module.exports = router;