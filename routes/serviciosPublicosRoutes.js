const express = require('express');
const router = express.Router();
const { handleWebhookEvent } = require('../controllers/servicios_publicos/webhookController');

router.post('/webhooks', handleWebhookEvent);

module.exports = router;
