import { receiveMessage, extractMessagesFromConversation as extractMessagesFromChatHelper } from '../../utils/chatHelper.js';

export function handleMessageReceived(payload) {
    const message = payload.message;
    const conversationId = payload.conversation.id;
    try {
        receiveMessage(message.content, conversationId);
    } catch (error) {
        console.error("Error processing received message:", error);
    }
}

export async function extractMessagesFromConversation(conversationId, leads = [], conversations = []) {
    try {
        const messages = await extractMessagesFromChatHelper(conversationId, leads, conversations);
        
        // Si no hay leads pasados, usamos datos de prueba
        if (leads.length === 0) {
            leads = [{ customerName: 'John Doe', customerEmail: 'john.doe@example.com', customerPhone: '123456789', documentType: 'telefonia' }];
        }

        return { leads, messages };
    } catch (error) {
        console.error("Error extracting messages from conversation:", error);
        return { leads: [], messages: [] };
    }
}
