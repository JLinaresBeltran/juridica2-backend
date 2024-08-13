const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { generateDocx } = require('../utils/GenerateDocx');
const { sendEmailWithAttachments } = require('../utils/emailModule');

const secretKey = process.env.SECRET_KEY;
const chatbotId = process.env.CHATBOT_ID_TELEFONIA;

let inactivityTimer;
let leads = [];
let conversations = [];
let lastConversationId = null;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(async () => {
        await processLeadsAndConversations(leads, conversations);
        leads = [];
        conversations = [];
    }, 60000); // 1 minuto de inactividad
}

function receiveMessage(message, conversationId) {
    if (conversationId) {
        lastConversationId = conversationId;
    }
}

async function extractMessagesFromConversation(conversationId) {
    try {
        const response = await fetch(`https://www.chatbase.co/api/v1/get-conversations?chatbotId=${chatbotId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`¡Error HTTP! estado: ${response.status}`);
            return [];
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            return [];
        }

        const conversation = data.data.find(conv => conv.id === conversationId);
        if (!conversation) {
            return [];
        }

        const messages = conversation.messages.map(message => ({
            author: message.role === 'assistant' ? 'JULI' : 'USUARIO',
            content: message.content,
        }));

        const leadData = conversation.form_submission || {};
        const lead = {
            name: leadData.name || 'Nombre no proporcionado',
            email: leadData.email || 'Email no proporcionado',
            phone: leadData.phone || 'Teléfono no proporcionado'
        };

        if (!Array.isArray(conversations)) {
            conversations = []; // Asegurar que es un array
        }

        conversations.push({ conversationId, messages });
        await processLeadsAndConversations([lead], conversations);
        leads = [];
        conversations = [];
        return messages;
    } catch (error) {
        console.error('Error al extraer conversaciones:', error);
        return [];
    }
}

async function processLeadsAndConversations(leads, conversations) {
    if (leads.length === 0 || conversations.length === 0) {
        console.log('No hay leads o conversaciones para procesar');
        return;
    }

    const lead = leads[0]; // Tomamos el primer lead
    const conversation = conversations[0]; // Tomamos la primera conversación

    const complaintContent = extractComplaintContent(conversation.messages);

    const docxPath = path.join(__dirname, 'output.docx');

    try {
        await generateDocx(complaintContent, docxPath);

        const attachments = [
            { filename: 'reclamacion.docx', path: docxPath },
        ];

        await sendEmailWithAttachments(
            lead.email,
            'Su Reclamación',
            'Adjunto encontrará el documento con su reclamación.',
            attachments
        );

        fs.unlinkSync(docxPath);
    } catch (error) {
        console.error('Error en el procesamiento de la reclamación:', error);
    }
}

function extractComplaintContent(messages) {
    const hechos = [];
    let peticion = '';
    let reference = 'Reclamación de servicios de telefonía';
    
    messages.forEach(message => {
        if (message.author === 'USUARIO' && message.content.toLowerCase().includes('hecho')) {
            hechos.push(message.content.replace(/^hecho:?\s*/i, ''));
        }
        if (message.author === 'USUARIO' && message.content.toLowerCase().includes('petición')) {
            peticion = message.content.replace(/^petición:?\s*/i, '');
        }
    });

    return {
        companyName: "Empresa de Telefonía",
        reference: reference,
        customerName: leads[0].name,
        customerId: "N/A", // Deberías obtener esto de algún lugar
        hechos: hechos,
        peticion: peticion,
        address: "N/A", // Deberías obtener esto de algún lugar
        email: leads[0].email,
        phone: leads[0].phone
    };
}

module.exports = {
    resetInactivityTimer,
    receiveMessage,
    extractMessagesFromConversation,
};