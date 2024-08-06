const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
//const { convertHTMLToPDF } = require('../utils/pdfGenerator');
const { convertHTMLToDOCX } = require('../utils/docxGenerator');
const { sendEmailWithAttachments } = require('../utils/emailTransporter');

const chatbotId = process.env.CHATBOT_ID_SERVICIOS_PUBLICOS;
const secretKey = process.env.SECRET_KEY;

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

        const leadData = conversation.form_submission;
        const lead = {
            customerName: leadData.name,
            customerEmail: leadData.email,
            customerPhone: leadData.phone
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
    let content = "Información del Usuario y Conversaciones:\n\n";

    if (leads.length > 0) {
        content += "Detalles de Leads:\n\n";
        leads.forEach(lead => {
            content += `Email: ${lead.customerEmail}\nNombre: ${lead.customerName}\nTeléfono: ${lead.customerPhone}\n\n`;
        });
    }

    if (conversations.length > 0) {
        content += "Detalles de Conversaciones:\n\n";
        conversations.forEach(conversation => {
            content += `ID de conversación: ${conversation.conversationId}\n\n`;
            conversation.messages.forEach(message => {
                content += `${message.author}: ${message.content}\n`;
            });
            content += "\n";
        });
    }

    const htmlContent = generateHTML(content);
    //const pdfPath = path.join(__dirname, 'output.pdf');
    const docxPath = path.join(__dirname, 'output.docx');

   // await convertHTMLToPDF(htmlContent, pdfPath);
    await convertHTMLToDOCX(htmlContent, docxPath);

    const attachments = [
        { filename: 'documento.pdf', path: pdfPath },
        { filename: 'documento.docx', path: docxPath },
    ];

    await sendEmailWithAttachments(
        leads[0].customerEmail,
        'Leads y Conversaciones',
        'Adjunto encontrará el documento con los leads y conversaciones.',
        attachments
    );

    fs.unlinkSync(pdfPath);
    fs.unlinkSync(docxPath);
}

const generateHTML = (content) => {
    return `
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                line-height: 1.6;
            }
            .container {
                padding: 20px;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .section {
                margin-bottom: 20px;
            }
            .section h2 {
                font-size: 1.2em;
                margin-bottom: 10px;
            }
            .section p {
                margin: 0;
                padding: 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Leads y Conversaciones</h1>
            </div>
            <div class="section">
                <p>${content.replace(/\n/g, '<br>')}</p>
            </div>
        </div>
    </body>
    </html>`;
};

module.exports = {
    resetInactivityTimer,
    receiveMessage,
    extractMessagesFromConversation,
};
