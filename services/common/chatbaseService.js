const fetch = require('node-fetch');

const CHATBASE_API_URL = 'https://www.chatbase.co/api/v1';
const API_KEY = process.env.SECRET_KEY;

console.log('chatbaseService.js cargado');
console.log('API_KEY definida:', !!API_KEY);

const getLeadByDetails = async (chatbotId, email, phone) => {
  console.log('[getLeadByDetails] Buscando lead con:', { chatbotId, email, phone });
  try {
    const response = await fetch(`${CHATBASE_API_URL}/get-leads?chatbotId=${chatbotId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[getLeadByDetails] Error en la respuesta de get-leads:', errorData);
      throw new Error(errorData.message);
    }

    const leads = await response.json();
    console.log('[getLeadByDetails] Respuesta de get-leads recibida:', JSON.stringify(leads, null, 2));

    if (!leads.collectedCustomers || !leads.collectedCustomers.data) {
      console.error('[getLeadByDetails] La respuesta de get-leads no contiene datos');
      return null;
    }

    const lead = leads.collectedCustomers.data.find(lead => lead.email === email && lead.phone === phone);
    
    if (lead) {
      console.log('[getLeadByDetails] Lead encontrado:', JSON.stringify(lead, null, 2));
    } else {
      console.log('[getLeadByDetails] No se encontró ningún lead para el email y teléfono proporcionados');
    }
    
    return lead || null;
  } catch (error) {
    console.error('[getLeadByDetails] Error:', error.message);
    return null;
  }
};

const getConversationById = async (chatbotId, conversationId) => {
  console.log('[getConversationById] Buscando conversación con:', { chatbotId, conversationId });
  try {
    const response = await fetch(`${CHATBASE_API_URL}/get-conversations?chatbotId=${chatbotId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[getConversationById] Error en la respuesta de get-conversations:', errorData);
      throw new Error(errorData.message);
    }

    const conversations = await response.json();
    console.log('[getConversationById] Respuesta de get-conversations recibida:', JSON.stringify(conversations, null, 2));

    if (!conversations.data) {
      console.error('[getConversationById] La respuesta de get-conversations no contiene datos');
      return null;
    }

    const conversation = conversations.data.find(conversation => conversation.id === conversationId);
    
    if (conversation) {
      console.log('[getConversationById] Conversación encontrada:', JSON.stringify(conversation, null, 2));
    } else {
      console.log('[getConversationById] No se encontró ninguna conversación con el ID proporcionado');
    }
    
    return conversation || null;
  } catch (error) {
    console.error('[getConversationById] Error:', error.message);
    return null;
  }
};

console.log('Exportando funciones desde chatbaseService.js');
module.exports = { getLeadByDetails, getConversationById };