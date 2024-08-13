const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const AgenteTelefonia = require('../../agents/AgenteTelefonia');
const emailModule = require('../../utils/emailModule');
const { getLeadByDetails, getConversationById } = require('../../services/common/chatbaseService');
const { generateDocx } = require('../../utils/generateDocx');

class CommonController {
  static async generateFiles(documentContent, paths) {
    console.log('[generateFiles] Iniciando generación de archivos');
    const { docxPath } = paths;

    try {
      console.log('[generateFiles] Generando archivo DOCX');
      await generateDocx(documentContent, docxPath);
      console.log(`[generateFiles] Archivo DOCX generado exitosamente: ${docxPath}`);
      return { docxPath };
    } catch (error) {
      console.error('[generateFiles] Error al generar archivo DOCX:', error);
      throw error;
    }
  }

  static async processConversation(conversationId, serviceType, payload) {
    console.log('[processConversation] Iniciando procesamiento de conversación:', { conversationId, serviceType, payload });
    try {
      const { chatbotId, customerEmail, customerPhone, customerName } = payload;
      console.log('[processConversation] Datos del payload:', { chatbotId, customerEmail, customerPhone, customerName });

      let lead = await getLeadByDetails(chatbotId, customerEmail, customerPhone);
      console.log('[processConversation] Lead obtenido:', JSON.stringify(lead, null, 2));

      if (!lead) {
        lead = { chatbotId, email: customerEmail, phone: customerPhone, name: customerName };
        console.log('[processConversation] Creando nuevo lead:', JSON.stringify(lead, null, 2));
      }

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
      const files = await CommonController.generateFiles(documentContent, { docxPath });
      console.log('[processConversation] Archivos generados:', files);

      console.log('[processConversation] Enviando email con serviceType:', serviceType);
      await emailModule.emailModule(lead, outputDir, serviceType);
      console.log('[processConversation] Email enviado correctamente.');

    } catch (error) {
      console.error('[processConversation] Error al procesar la conversación:', error);
      console.error('[processConversation] Stack trace:', error.stack);
      throw error;
    }
  }

  static extractHtmlContent(openAiResponse) {
    if (openAiResponse.choices && openAiResponse.choices.length > 0) {
      return openAiResponse.choices[0].message.content;
    } else if (openAiResponse.response) {
      return openAiResponse.response;
    } else {
      console.error('OpenAI Response no contiene choices ni response:', JSON.stringify(openAiResponse, null, 2));
      throw new Error('No hay choices válidos ni response en la respuesta de OpenAI');
    }
  }
}

module.exports = CommonController;