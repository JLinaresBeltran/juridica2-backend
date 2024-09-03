// 9. routes/auth.js
const express = require('express');
const AuthController = require('../controllers/common/AuthController');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/reset-password', AuthController.resetPassword);
router.post('/reset-password-process', AuthController.processPasswordReset);

module.exports = router;