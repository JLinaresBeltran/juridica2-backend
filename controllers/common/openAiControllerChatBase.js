const OpenAI = require('openai');

// Configuración de OpenAI utilizando variables de entorno
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateResponse = async (prompt) => {
  try {
    console.log('Iniciando generateResponse con prompt:', JSON.stringify(prompt, null, 2));

    // Realizar la llamada a la API de OpenAI
    console.log('Llamando a la API de OpenAI...');
    const chatResponse = await openai.chat.completions.create({
      model: prompt.model || "gpt-3.5-turbo-0125",
      messages: prompt.messages,
      temperature: prompt.temperature || 1,
    });

    console.log('Respuesta recibida de OpenAI:', JSON.stringify(chatResponse, null, 2));

    if (chatResponse && chatResponse.choices && chatResponse.choices.length > 0) {
      const assistantResponse = chatResponse.choices[0].message.content;

      console.log('Respuesta del asistente:', assistantResponse);
      console.log('Tokens utilizados:', chatResponse.usage.total_tokens);

      return {
        response: assistantResponse,
        role: 'assistant',
        tokensUsed: chatResponse.usage.total_tokens,
      };
    } else {
      console.error('Respuesta de OpenAI inesperada o vacía:', chatResponse);
      throw new Error("Respuesta de OpenAI inesperada o vacía.");
    }
  } catch (error) {
    console.error('Error en generateResponse:', error);
    console.error('Detalles del error:', error.response ? error.response.data : 'No hay detalles adicionales');
    throw new Error("Error procesando la solicitud: " + error.toString());
  }
};

module.exports = {
  generateResponse,
};