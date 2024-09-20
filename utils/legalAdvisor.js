const AlmacenamientoVectorial = require('../almacenamiento/almacenamientoVectorial');
const { OpenAI } = require("langchain/llms/openai");
const { ConversationalRetrievalQAChain } = require("langchain/chains");
const { PromptTemplate } = require("langchain/prompts");
const { BufferMemory } = require("langchain/memory");

let legalAdvisorInstance = null;
let initializationPromise = null;

async function initializeLegalAdvisor(maxRetries = 3) {
  if (legalAdvisorInstance) {
    console.log("Asesor Jurídico AI ya inicializado. Retornando instancia existente.");
    return legalAdvisorInstance;
  }

  if (!initializationPromise) {
    initializationPromise = _initializeLegalAdvisor(maxRetries);
  }

  return initializationPromise;
}

async function _initializeLegalAdvisor(maxRetries) {
  console.log("Inicializando el Asesor Jurídico AI...");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await AlmacenamientoVectorial.inicializar();
      console.log("Almacenamiento vectorial inicializado.");

      const llm = new OpenAI({
        modelName: "gpt-4o",
        temperature: 0.2,
        maxTokens: 1000,
      });
      console.log("Modelo de lenguaje GPT-4 inicializado.");

      const memory = new BufferMemory({
        memoryKey: "chat_history",
        returnMessages: true,
        inputKey: "question",
        outputKey: "text",
      });

      const promptTemplate = `
      Eres un abogado especializado en derecho constitucional colombiano. Utiliza la información proporcionada en el contexto para responder la pregunta del usuario. Si la información no es suficiente, indícalo claramente.

      Contexto de la Constitución:
      {context}

      Historial de chat: {chat_history}
      Pregunta del usuario: {question}

      Respuesta del Asesor Jurídico:
      `;

      const PROMPT = PromptTemplate.fromTemplate(promptTemplate);

      const qaChain = ConversationalRetrievalQAChain.fromLLM(
        llm,
        AlmacenamientoVectorial.vectorStore.asRetriever(),
        {
          returnSourceDocuments: true,
          generateFollowUpQuestions: false,
          memory: memory,
          questionGeneratorChainOptions: {
            llm: llm,
            template: PROMPT.template,
          },
          qaChainOptions: {
            type: "stuff",
            prompt: PROMPT,
          },
        }
      );

      console.log("Cadena de conversación creada.");

      legalAdvisorInstance = async (question) => {
        try {
          console.log("Pregunta recibida en legalAdvisor:", question);
          
          const relevantDocs = await AlmacenamientoVectorial.buscarSimilares(question, 5);
          console.log("Documentos relevantes encontrados:", JSON.stringify(relevantDocs, null, 2));
          
          if (relevantDocs.length === 0) {
            console.log("No se encontraron documentos relevantes.");
            return {
              text: "Lo siento, no he encontrado información específica sobre esa pregunta en la Constitución colombiana. ¿Podría reformular su pregunta o proporcionar más detalles?",
              sourceDocuments: []
            };
          }

          const context = relevantDocs.map(doc => 
            `Artículo ${doc.metadata.numeroArticulo}: ${doc.contenido}`
          ).join('\n\n');
      
          console.log("Contexto generado para la consulta:", context);
      
          const response = await qaChain.call({ question, context });
          
          console.log("Respuesta generada por el modelo:", response.text);
          
          return {
            text: response.text,
            sourceDocuments: relevantDocs,
          };
        } catch (error) {
          console.error("Error en legalAdvisorInstance:", error);
          return {
            text: "Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta de nuevo más tarde.",
            sourceDocuments: []
          };
        }
      };

      console.log("Asesor Jurídico AI inicializado exitosamente.");
      return legalAdvisorInstance;
    } catch (error) {
      console.error(`Error en el intento ${attempt} de inicializar el Asesor Jurídico AI: ${error.message}`);
      if (attempt === maxRetries) {
        console.error("Se alcanzó el número máximo de intentos. No se pudo inicializar el Asesor Jurídico AI.");
        initializationPromise = null;
        throw error;
      }
      const waitTime = attempt * 5000;
      console.log(`Esperando ${waitTime / 1000} segundos antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

module.exports = { initializeLegalAdvisor };