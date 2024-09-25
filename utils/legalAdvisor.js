const AlmacenamientoVectorial = require('../almacenamiento/almacenamientoVectorial');
const { OpenAI } = require("langchain/llms/openai");
const { ConversationalRetrievalQAChain } = require("langchain/chains");
const { PromptTemplate } = require("langchain/prompts");
const { BufferMemory } = require("langchain/memory");
const { performance } = require('perf_hooks');

let legalAdvisorInstance = null;
let initializationPromise = null;

function medirTiempo(fn) {
  return async function(...args) {
    const inicio = performance.now();
    const resultado = await fn.apply(this, args);
    const fin = performance.now();
    console.log(`${fn.name || 'Función anónima'} tomó ${(fin - inicio).toFixed(2)} ms`);
    return resultado;
  }
}

async function buscarSimilares(question, k) {
  console.log("Iniciando búsqueda de documentos similares...");
  const inicio = performance.now();
  const docs = await AlmacenamientoVectorial.buscarSimilares(question, k);
  const fin = performance.now();
  console.log(`Búsqueda completada en ${(fin - inicio).toFixed(2)} ms. Encontrados ${docs.length} documentos.`);
  console.log("Documentos encontrados:", JSON.stringify(docs, null, 2));
  return docs;
}

async function analizarRespuestaModelo(llm, question, context) {
  console.log("Iniciando analizarRespuestaModelo");
  let respuestaCompleta = '';
  let primerFragmentoRecibido = false;
  const inicioTotal = performance.now();

  const promptTemplate = `
  
  Eres un abogado experto derecho procesal colombiano. Utiliza unicamenete la información proporcionada para responder, no puedes inventar ni utilizar tu conocimiento general. Realiza un razonamiento juridico solido, para procesar la respuesta. Si la información no es suficiente, indícalo claramente.
  

  Informacion proporcionada:
  {context}

  Pregunta del usuario: {question}

  Respuesta del Asesor Jurídico:
  `;

  const PROMPT = PromptTemplate.fromTemplate(promptTemplate);
  const promptValue = await PROMPT.format({ context, question });

  console.log(`Tamaño del prompt (caracteres): ${promptValue.length}`);
  console.log(`Tamaño del prompt (tokens estimados): ${Math.ceil(promptValue.length / 4)}`);

  console.log("Enviando consulta al modelo de lenguaje...");
  const inicioModelo = performance.now();

  try {
    const response = await llm.call(promptValue);
    respuestaCompleta = response;

    const finModelo = performance.now();
    console.log(`Respuesta completa recibida en ${finModelo - inicioModelo} ms`);
    console.log(`Tamaño de la respuesta (caracteres): ${respuestaCompleta.length}`);
    console.log(`Tamaño de la respuesta (tokens estimados): ${Math.ceil(respuestaCompleta.length / 4)}`);
    console.log("Respuesta completa:", respuestaCompleta);

    return respuestaCompleta;
  } catch (error) {
    console.error("Error en analizarRespuestaModelo:", error);
    throw error;
  }
}

async function initializeLegalAdvisor(maxRetries = 3) {
  console.log("Iniciando initializeLegalAdvisor");
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
      if (typeof AlmacenamientoVectorial.inicializar !== 'function') {
        throw new Error('AlmacenamientoVectorial.inicializar no es una función');
      }

      await medirTiempo(AlmacenamientoVectorial.inicializar.bind(AlmacenamientoVectorial))();
      console.log("Almacenamiento vectorial inicializado.");

      const llm = new OpenAI({
        modelName: "gpt-4o-mini",  // Actualizado a la versión más reciente de GPT-4
        temperature: 0.2,
       // maxTokens: 1000,
        streaming: false,  // Cambiado a false para usar call() en lugar de stream()
      });
      console.log("Modelo de lenguaje GPT-4 inicializado.");

      const memory = new BufferMemory({
        memoryKey: "chat_history",
        returnMessages: true,
        inputKey: "question",
        outputKey: "text",
      });

      legalAdvisorInstance = medirTiempo(async (question) => {
        console.log("Iniciando legalAdvisorInstance con pregunta:", question);
        try {
          const relevantDocs = await medirTiempo(buscarSimilares)(question, 5);
          
          if (relevantDocs.length === 0) {
            console.log("No se encontraron documentos relevantes.");
            return {
              text: "Lo siento, no he encontrado información específica sobre esa pregunta en la legislación colombiana. ¿Podría reformular su pregunta o proporcionar más detalles?",
              sourceDocuments: []
            };
          }

          console.log("Generando contexto para la consulta...");
          const inicioContexto = performance.now();
          const context = relevantDocs.map(doc => 
            `Artículo ${doc.metadata.numeroArticulo}: ${doc.contenido}`
          ).join('\n\n');
          const finContexto = performance.now();
          console.log(`Contexto generado en ${(finContexto - inicioContexto).toFixed(2)} ms`);
          console.log("Contexto generado:", context);
      
          const respuesta = await analizarRespuestaModelo(llm, question, context);
          console.log("Respuesta final:", respuesta);
          
          return {
            text: respuesta,
            sourceDocuments: relevantDocs,
          };
        } catch (error) {
          console.error("Error en legalAdvisorInstance:", error);
          return {
            text: "Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta de nuevo más tarde.",
            sourceDocuments: []
          };
        }
      });

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