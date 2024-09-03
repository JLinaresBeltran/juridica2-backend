// 11. routes/credit.js
const express = require('express');
const CreditController = require('../controllers/common/CreditController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/purchase', CreditController.purchaseCredits);
router.post('/consume', CreditController.consumeCredits);
router.get('/balance', CreditController.getCreditBalance);
router.get('/history', CreditController.getPurchaseHistory);

module.exports = router;