function extractHtmlContent(openAiResponse) {
    if (openAiResponse.choices && openAiResponse.choices.length > 0) {
        return openAiResponse.choices[0].message.content;
    } else if (openAiResponse.response) {
        return openAiResponse.response;
    } else {
        console.error('OpenAI Response no contiene choices ni response:', JSON.stringify(openAiResponse, null, 2));
        throw new Error('No hay choices válidos ni response en la respuesta de OpenAI');
    }
}

module.exports = {
    extractHtmlContent
};

// aqui se puede colocar filtros para la respuesta de la API para que no incluya cosas puntuales en el documento como comentarios entre otros.