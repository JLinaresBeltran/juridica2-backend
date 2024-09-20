const express = require('express');
const router = express.Router();
const ControladorChatJuridico = require('../controllers/common/ControladorChatJuridico');
const { initializeLegalAdvisor } = require('../utils/legalAdvisor');

let legalAdvisor;

initializeLegalAdvisor().then(advisor => {
    legalAdvisor = advisor;
    console.log("Asesor jurídico AI con GPT-4 inicializado y listo para usar en las rutas de chat jurídico.");
}).catch(error => {
    console.error("Error al inicializar el asesor jurídico con GPT-4 en las rutas de chat jurídico:", error);
});

router.post('/consulta', ControladorChatJuridico.procesarConsulta.bind(ControladorChatJuridico));

router.post('/legal-advice', async (req, res) => {
    if (!legalAdvisor) {
        return res.status(503).json({ error: 'El asesor jurídico aún no está listo.' });
    }

    const { question } = req.body;
    console.log("Solicitud recibida en /legal-advice:", JSON.stringify(req.body, null, 2));

    try {
        const response = await legalAdvisor(question);
        console.log("Respuesta del asesor jurídico:", JSON.stringify(response, null, 2));
        res.json({ answer: response });
    } catch (error) {
        console.error('Error in legal advisor:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

module.exports = router;