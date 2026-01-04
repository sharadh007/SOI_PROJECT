const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { validateRecommendationRequest } = require('../middleware/validation');

router.post('/get-recommendations', validateRecommendationRequest, recommendationController.getRecommendations);

module.exports = router;
