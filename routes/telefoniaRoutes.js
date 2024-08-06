// telefoniaRoutes.js
const express = require('express');
const router = express.Router();
const { handleWebhookEvent, handleFormSubmission } = require('../controllers/telefonia/webhookController');

router.post('/submit-form', async (req, res) => {
    console.log('[/submit-form] Datos del formulario recibidos:', JSON.stringify(req.body, null, 2));
    try {
        await handleFormSubmission(req.body);
        console.log('[/submit-form] Formulario procesado con éxito');
        res.json({ success: true, message: 'Formulario procesado con éxito' });
    } catch (error) {
        console.error('[/submit-form] Error al procesar el formulario:', error);
        console.error('[/submit-form] Stack trace:', error.stack);
        res.status(500).json({ success: false, message: 'Error al procesar el formulario' });
    }
});

router.post('/webhooks', handleWebhookEvent);

module.exports = router;