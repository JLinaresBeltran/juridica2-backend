const crypto = require('crypto');
const { delayExecution } = require('../../utils/inactivityTimer');
const { resetInactivityTimer, receiveMessage } = require('../../utils/chatHelperServiciosPublicos');
const { processConversation } = require('../common/conversationProcessor');
const { getLeadByConversationId, getConversationById } = require('../../services/common/chatbaseService');
const SECRET_KEY = process.env.CHATBASE_SECRET_SERVICIOS_PUBLICOS; // Clave específica para servicios públicos
const serviceType = 'servicios_publicos';

async function handleWebhookEvent(req, res) {
    const event = req.body;

    try {
        const signature = req.headers['x-chatbase-signature'];
        const rawBody = JSON.stringify(req.body);

        // Verificar la firma del mensaje
        const computedSignature = crypto.createHmac('sha1', SECRET_KEY).update(rawBody).digest('hex');
        if (signature !== computedSignature) {
            console.error("La firma no coincide");
            return res.status(400).json({ message: "La firma no coincide" });
        }

        await handleEventType(event);

        res.status(200).send('Evento recibido');
    } catch (error) {
        console.error('Error al procesar el evento:', error);
        if (!res.headersSent) {
            res.status(500).send('Error al procesar el evento');
        }
    }
}

async function handleEventType(event) {
    if (event.eventType === 'leads.submit') {
        await handleLeadsSubmit(event.payload);
    } else if (event.eventType === 'message.received') {
        await handleMessageReceived(event.payload);
    } else if (event.eventType === 'conversation.completed') {
        await handleConversationCompleted(event.payload);
    }
}

async function handleLeadsSubmit(payload) {
    const chatbotId = process.env.CHATBOT_ID_SERVICIOS_PUBLICOS;

    if (payload.conversationId) {
        await delayExecution(() => processConversation(payload.conversationId, serviceType));
    } else {
        console.error('El evento de lead.submit no tiene un ID de conversación.');
    }
}

async function handleMessageReceived(payload) {
    const message = payload.message;
    const conversationId = payload.conversation.id;
    receiveMessage(message.content, conversationId);
    resetInactivityTimer();
}

async function handleConversationCompleted(payload) {
    const conversation = payload.conversation;
    const chatbotId = process.env.CHATBOT_ID_SERVICIOS_PUBLICOS;
    await delayExecution(() => processConversation(conversation.id, serviceType));
}

module.exports = {
    handleWebhookEvent,
};
