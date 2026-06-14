const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { auth } = require('../middleware/auth');

router.get('/insights', auth, aiController.getInsights);
router.get('/risk-analysis', auth, aiController.getRiskAnalysis);
router.get('/recommendations', auth, aiController.getRecommendations);

module.exports = router;