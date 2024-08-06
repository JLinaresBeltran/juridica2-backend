// En conversationProcessor.js

const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const AgenteTelefonia = require('../../agents/AgenteTelefonia');
const { sendEmailWithFiles } = require('../../controllers/common/sendEmail');
const { getLeadByDetails, getConversationById } = require('../../services/common/chatbaseService');
const { generateDocx } = require('../../utils/generateDocx');

// Definir la función generateFiles aquí
async function generateFiles(documentContent, paths) {
  console.log('[generateFiles] Iniciando generación de archivos');
  const { docxPath } = paths;

  console.log('[generateFiles] Generando archivo DOCX');
  await generateDocx(documentContent, docxPath);
  console.log(`[generateFiles] Archivo DOCX generado exitosamente: ${docxPath}`);

  return { docxPath };
}

async function processConversation(conversationId, serviceType, payload) {
  console.log('[processConversation] Iniciando procesamiento de conversación:', { conversationId, serviceType, payload });
  try {
    const { chatbotId, customerEmail, customerPhone, customerName } = payload;
    console.log('[processConversation] Datos del payload:', { chatbotId, customerEmail, customerPhone, customerName });

    let lead = await getLeadByDetails(chatbotId, customerEmail, customerPhone);
    console.log('[processConversation] Lead obtenido:', JSON.stringify(lead, null, 2));

    // Si no se encuentra un lead, creamos uno nuevo con los datos del payload
    if (!lead) {
      lead = {
        chatbotId,
        email: customerEmail,
        phone: customerPhone,
        name: customerName,
        // Otros campos que puedas necesitar
      };
      console.log('[processConversation] Creando nuevo lead:', JSON.stringify(lead, null, 2));
    }

    // Asegurarse de que el lead tenga un nombre
    lead.name = lead.name || customerName;

    const conversation = await getConversationById(chatbotId, conversationId);
    console.log('[processConversation] Conversación obtenida:', JSON.stringify(conversation, null, 2));

    let documentContent;
    if (serviceType === 'telefonia') {
      const agenteTelefonia = new AgenteTelefonia();
      console.log('[processConversation] Procesando queja con agente de telefonía');
      documentContent = await agenteTelefonia.processComplaint(conversation, lead);
      
      documentContent = {
        ...documentContent,
        documentNumber: lead.documentNumber || payload.documentNumber || null,
        name: lead.name,
      };
      
      console.log('[processConversation] Contenido del documento generado por el agente:', JSON.stringify(documentContent, null, 2));
    } else {
      console.error('[processConversation] Tipo de servicio no válido:', serviceType);
      throw new Error('Tipo de servicio no válido');
    }

    const outputDir = path.join(__dirname, '..', 'common', 'output', conversationId);
    console.log('[processConversation] Verificando si el directorio de salida existe:', outputDir);
    
    if (!fsSync.existsSync(outputDir)) {
      console.log('[processConversation] El directorio no existe, creándolo...');
      await fs.mkdir(outputDir, { recursive: true });
      console.log('[processConversation] Directorio creado:', outputDir);
    } else {
      console.log('[processConversation] El directorio ya existe:', outputDir);
    }

    const docxPath = path.join(outputDir, 'output.docx');

    console.log('[processConversation] Generando archivo DOCX');
    const files = await generateFiles(documentContent, { docxPath });
    console.log('[processConversation] Archivos generados:', files);

    console.log('[processConversation] Enviando email con serviceType:', serviceType);
    await sendEmailWithFiles(lead, outputDir, serviceType);
    console.log('[processConversation] Email enviado correctamente.');

  } catch (error) {
    console.error('[processConversation] Error al procesar la conversación:', error);
    console.error('[processConversation] Stack trace:', error.stack);
    throw error;
  }
}

module.exports = {
  processConversation
};