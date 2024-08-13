const { verifySignature } = require('../../utils/security.js');
const { delayExecution } = require('../../utils/inactivityTimer.js');
const leadService = require('../common/leadService.js');
const messageService = require('./messageService.js');
const documentService = require('../common/documentService.js');

async function processWebhookEvent(req) {
    const event = req.body;
    const signature = req.headers['x-chatbase-signature'];
    const rawBody = JSON.stringify(req.body);

    if (!verifySignature(signature, rawBody)) {
        console.error("La firma no coincide");
        throw new Error("La firma no coincide");
    }

    switch (event.eventType) {
        case 'leads.submit':
            await leadService.handleLeadSubmit(event.payload);
            break;
        case 'message.received':
            messageService.handleMessageReceived(event.payload);
            break;
        case 'conversation.completed':
            await handleConversationCompleted(event.payload.conversation);
            break;
        default:
            console.error(`Tipo de evento no soportado: ${event.eventType}`);
            throw new Error(`Tipo de evento no soportado: ${event.eventType}`);
    }
}

async function handleConversationCompleted(conversation) {
    const conversationId = conversation.id;
    await delayExecution(() => CommonController(conversationId), 1000); // Añadido delay para probar
}

async function CommonController(conversationId) {
    const { leads, messages } = await messageService.extractMessagesFromConversation(conversationId);

    if (!messages) {
        console.error("No se extrajeron mensajes de la conversación");
        throw new Error("No se extrajeron mensajes de la conversación");
    }

    const unifiedMessages = messages.map(msg => msg.content).join('\n');
    const lead = leads.length > 0 ? leads[0] : null;

    if (!lead) {
        console.error("No se extrajeron leads de la conversación");
        throw new Error("No se extrajeron leads de la conversación");
    }

    const documentType = lead.documentType || 'default';  // Determinar el tipo de documento basado en el lead
    await documentService.generateAndSendDocuments(lead, unifiedMessages, documentType);
}

module.exports = {
    processWebhookEvent,
};
