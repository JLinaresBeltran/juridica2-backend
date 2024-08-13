// webhookController.js
const crypto = require('crypto');
const { delayExecution } = require('../../utils/inactivityTimer');
const { resetInactivityTimer, receiveMessage } = require('../../utils/chatHelperTelefonia');
const CommonController = require('../common/CommonController');
const SECRET_KEY = process.env.CHATBASE_SECRET_TELEFONIA;
const serviceType = 'telefonia';

async function handleWebhookEvent(req, res) {
    console.log('[handleWebhookEvent] Iniciando manejo de evento webhook');
    const event = req.body;
    console.log('[handleWebhookEvent] Cuerpo de solicitud recibido:', JSON.stringify(event, null, 2));

    try {
        const signature = req.headers['x-chatbase-signature'];
        const rawBody = JSON.stringify(event);
        console.log('[handleWebhookEvent] Firma recibida:', signature);

        // Verificar la firma del mensaje
        const computedSignature = crypto.createHmac('sha1', SECRET_KEY).update(rawBody).digest('hex');
        console.log('[handleWebhookEvent] Firma computada:', computedSignature);
        
        if (signature !== computedSignature) {
            console.error("[handleWebhookEvent] La firma no coincide");
            return res.status(400).json({ message: "La firma no coincide" });
        }

        // Responder inmediatamente al cliente
        res.status(200).send('Evento recibido, iniciando procesamiento después de un minuto');

        // Manejar el evento en segundo plano después de un minuto
        await delayExecution(() => handleEventType(event));
        
    } catch (error) {
        console.error('[handleWebhookEvent] Error al procesar el evento:', error);
        console.error('[handleWebhookEvent] Stack trace:', error.stack);
        if (!res.headersSent) {
            res.status(500).send('Error al procesar el evento');
        }
    }
}

async function handleEventType(event) {
    console.log('[handleEventType] Manejando evento de tipo:', event.eventType);
    if (event.eventType === 'leads.submit') {
        await handleLeadsSubmit(event.payload, event.chatbotId);
    } else if (event.eventType === 'message.received') {
        await handleMessageReceived(event.payload);
    } else if (event.eventType === 'conversation.completed') {
        await handleConversationCompleted(event.payload, event.chatbotId);
    } else {
        console.warn('[handleEventType] Tipo de evento no reconocido:', event.eventType);
    }
}

async function handleLeadsSubmit(payload, chatbotId) {
    console.log('[handleLeadsSubmit] Manejando leads.submit:', JSON.stringify({ payload, chatbotId }, null, 2));
    if (payload.conversationId && chatbotId) {
        const customerData = {
            chatbotId: chatbotId,
            customerEmail: payload.customerEmail,
            customerPhone: payload.customerPhone,
            customerName: payload.customerName,
            documentNumber: payload.documentNumber,
            address: payload.address
        };
        console.log('[handleLeadsSubmit] Datos del cliente enviados a CommonController:', JSON.stringify(customerData, null, 2));
        await CommonController.processConversation(payload.conversationId, serviceType, customerData);
    } else {
        console.error('[handleLeadsSubmit] El evento de lead.submit no tiene un ID de conversación o chatbotId.', JSON.stringify({ payload, chatbotId }, null, 2));
    }
}

async function handleMessageReceived(payload) {
    console.log('[handleMessageReceived] Manejando message.received:', JSON.stringify(payload, null, 2));
    const message = payload.message;
    const conversationId = payload.conversation.id;
    receiveMessage(message.content, conversationId);
    resetInactivityTimer();
}

async function handleConversationCompleted(payload, chatbotId) {
    console.log('[handleConversationCompleted] Manejando conversation.completed:', JSON.stringify({ payload, chatbotId }, null, 2));
    const conversation = payload.conversation;
    if (conversation.id && chatbotId) {
        const customerData = {
            chatbotId: chatbotId,
            customerEmail: payload.customerEmail,
            customerPhone: payload.customerPhone,
            customerName: payload.customerName,
            documentNumber: payload.documentNumber,
            address: payload.address
        };
        console.log('[handleConversationCompleted] Datos del cliente enviados a CommonController:', JSON.stringify(customerData, null, 2));
        await CommonController.processConversation(conversation.id, serviceType, customerData);
    } else {
        console.error('[handleConversationCompleted] El evento de conversation.completed no tiene un ID de conversación o chatbotId.', JSON.stringify({ payload, chatbotId }, null, 2));
    }
}

async function handleFormSubmission(formData) {
    console.log('[handleFormSubmission] Procesando datos del formulario:', JSON.stringify(formData, null, 2));
    
    if (!formData.name || !formData.email || !formData.phone) {
      console.error('[handleFormSubmission] Error: Datos del formulario incompletos');
      throw new Error('Datos del formulario incompletos');
    }
  
    const customerData = {
      chatbotId: formData.chatbotId,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      customerName: formData.name,
      documentNumber: formData.documentNumber,
      address: formData.address
    };
    console.log('[handleFormSubmission] Datos del cliente preparados:', JSON.stringify(customerData, null, 2));
    
    try {
        await CommonController.processConversation(formData.conversationId, 'telefonia', customerData);
        console.log('[handleFormSubmission] Conversación procesada exitosamente');
      } catch (error) {
        console.error('[handleFormSubmission] Error al procesar la conversación:', error);
        console.error('[handleFormSubmission] Stack trace:', error.stack);
        throw error;
      }
    }

module.exports = {
    handleWebhookEvent,
    handleFormSubmission
};