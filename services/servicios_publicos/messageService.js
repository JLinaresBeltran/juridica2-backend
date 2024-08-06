const { receiveMessage, extractMessagesFromConversation: extractMessagesFromChatHelper } = require('../../utils/chatHelper.js');

function handleMessageReceived(payload) {
    try {
        const message = payload.message;
        const conversationId = payload.conversation.id;
        receiveMessage(message.content, conversationId);
    } catch (error) {
        console.error("Error procesando el mensaje recibido:", error);
    }
}

async function extractMessagesFromConversation(conversationId) {
    try {
        const messages = await extractMessagesFromChatHelper(conversationId);
        // Datos de prueba para leads
        const leads = [{ customerName: 'John Doe', customerEmail: 'john.doe@example.com', documentType: 'telefonia' }];
        return { leads, messages };
    } catch (error) {
        console.error("Error extrayendo mensajes de la conversación:", error);
        throw error; // Re-throw the error to be handled by the calling function
    }
}

module.exports = {
    handleMessageReceived,
    extractMessagesFromConversation
};
