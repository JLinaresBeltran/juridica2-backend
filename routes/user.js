const express = require('express');
const UserController = require('../controllers/common/UserController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', UserController.getUserData);  // Añade esta línea
router.put('/profile', UserController.updateProfile);
router.post('/activity', UserController.updateLastActivity);

module.exports = router;