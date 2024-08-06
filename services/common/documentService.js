const fs = require('fs');
const path = require('path');
const { sendEmailWithAttachments } = require('../../utils/mailer.js');
const { convertHTMLToDOCX } = require('../../utils/docxGenerator.js');
const { getLeadByConversationId, getConversationById } = require('./chatbaseService.js');
const AgenteTelefonia = require('../agents/AgenteTelefonia');

async function generateAndSendDocuments(chatbotId, conversationId, documentType, serviceType) {
    try {
        // Obtener datos de Chatbase
        const lead = await getLeadByConversationId(chatbotId, conversationId);
        const conversation = await getConversationById(chatbotId, conversationId);

        if (!lead || !conversation) {
            throw new Error('Lead or conversation not found');
        }

        const outputDir = path.join(__dirname, '../../output', lead.customerEmail);
        
        const htmlPath = path.join(outputDir, 'output.html');
        const docxPath = path.join(outputDir, 'output.docx');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Usar AgenteTelefonia para generar el contenido HTML
        const agenteTelefonia = new AgenteTelefonia();
        const htmlContent = await agenteTelefonia.processComplaint(conversation.messages, lead);

        // Guardar HTML en un archivo
        fs.writeFileSync(htmlPath, htmlContent);

        // Convertir HTML a DOCX
        await convertHTMLToDOCX(htmlPath, docxPath);

        // Enviar el correo electrónico con los archivos adjuntos
        await sendEmailWithAttachments(
            lead.customerEmail,
            'Documentos Generados',
            htmlContent,
            [
                { filename: 'output.docx', path: docxPath },
                { filename: 'output.html', path: htmlPath }
            ]
        );

        // Limpiar archivos temporales
        fs.unlinkSync(htmlPath);
        fs.unlinkSync(docxPath);
    } catch (error) {
        console.error('Error en generateAndSendDocuments:', error);
        throw error; // Re-lanzar el error para manejarlo en un nivel superior si es necesario
    }
}

module.exports = {
    generateAndSendDocuments
};