const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require("langchain/prompts");
const { LLMChain } = require("langchain/chains");
const winston = require('winston');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;

// Configuración del logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      if (typeof message === 'object') {
        return `${timestamp} [${level}]: ${JSON.stringify(message, null, 2)}`;
      }
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Configuración del modelo OpenAI
const MODEL_NAME = "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("La clave API de OpenAI no está configurada en las variables de entorno.");
}

// Uso de Singleton para el modelo de OpenAI
const openAIModel = new ChatOpenAI({ 
  modelName: MODEL_NAME, 
  temperature: 0.3,
  openAIApiKey: OPENAI_API_KEY
});

// Implementar un sistema de retry para llamadas a la API
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response && error.response.status === 429);
  },
});

// Prompts actualizados
const prompts = {
  classifyAndPrepareDraft: PromptTemplate.fromTemplate(
    "Eres un abogado junior especializado en reclamaciones de servicios de telefonía, televisión o internet en Colombia. Tu tarea es analizar la conversación entre JULI (juridica en linea y el user) proporcionada y extraer la información clave del usuario. Sigue estas instrucciones:\n\n" +
    "Analiza la siguiente conversación y realiza estas tareas:\n" +
    "1. Elabora un resumen descriptivo detallado de la conversación en primera persona, como si fueras el cliente presentando su caso. Este resumen debe:\n" +
    "   - Capturar todos los puntos clave de la situación presentada por el usuario.\n" +
    "   - Mantener un orden cronológico de los eventos si es relevante.\n" +
    "   - Incluir todas las interacciones importantes entre el cliente y la empresa de servicios.\n" +
    "   - Ser lo suficientemente detallado para reflejar la complejidad del caso, sin importar su longitud.\n" +
    "   - Expresar claramente el problema o reclamación desde la perspectiva del cliente.\n" +
    "   - Incluir todos los datos relevantes como fechas, montos, nombres o números de referencia.\n" +
    "   - Adaptar su extensión a la complejidad y longitud de la conversación original, asegurando que se cubran todos los aspectos importantes sin omitir detalles cruciales.\n\n" +
    "2. CFacturación, lasifica el caso en una de estas categorías: Calidad del Servicio, Contratación, Atención al Cliente, Otro. Si el caso abarca múltiples categorías, selecciona la más predominante y menciona las secundarias.\n\n" +
    "3. Identifica la empresa de servicios mencionada en la conversación. Las principales empresas de telefonía en Colombia son:\n" +
    "   - CLARO (Razón social: COMUNICACIÓN CELULAR S.A. COMCEL S.A.)\n" +
    "   - MOVISTAR (Razón social: COLOMBIA TELECOMUNICACIONES S.A.)\n" +
    "   - TIGO (Razón social: COLOMBIA MÓVIL S.A. E.S.P.)\n" +
    "   - WOM (Razón social: PARTNERS TELECOM COLOMBIA S.A.S.)\n" +
    "   - ETB (Razón social: EMPRESA DE TELECOMUNICACIONES DE BOGOTÁ S.A.)\n" +
    "   - VIRGIN MOBILE (Razón social: VIRGIN MOBILE COLOMBIA S.A.S.)\n" +
    "   Si se menciona otra empresa, inclúyela con el nombre que aparece en la conversación.\n\n" +
    "Proporciona tu análisis en el siguiente formato:\n\n" +
    "RESUMEN DESCRIPTIVO (EN PRIMERA PERSONA):\n" +
    "[Incluye aquí el resumen detallado de la conversación, escrito como si fueras el cliente. La extensión debe adaptarse a la complejidad del caso, asegurando que se cubran todos los puntos importantes.]\n\n" +
    "CATEGORÍA: [Categoría principal del caso]\n" +
    "Categorías secundarias (si aplica): [Lista de categorías secundarias]\n\n" +
    "EMPRESA DE SERVICIOS: [Nombre comercial de la empresa (Razón social)]\n\n" +
    "Conversación: {conversation}"
  ),
  verifyAndRefine: PromptTemplate.fromTemplate(
   "Eres un abogado senior especializado en reclamaciones de servicios de telefonía, televisión o internet en Colombia. Tu tarea es redactar una reclamación formal basada en el análisis del abogado junior. Redacta en primera persona desde la perspectiva del cliente, pero con un tono jurídico y profesional. Analiza la siguiente información:\n\n" +
   "{junior_analysis}\n\n" +
   "Realiza las siguientes tareas:\n" +
   "1. Verifica la precisión de la clasificación y los datos extraídos por el abogado junior.\n" +
   "2. Redacta los HECHOS de manera clara, concisa y jurídicamente relevante:\n" +
   "   - Ordénalos de manera lógica y cronológica.\n" +
   "   - Incluye todos los datos relevantes proporcionados por el junior.\n" +
   "   - Utiliza un lenguaje formal y técnico apropiado para una reclamación legal.\n" +
   "   - Incorpora de manera estratégica expresiones que reflejen la impotencia y malestar del cliente únicamente en los últimos hechos, sin comprometer la profesionalidad del documento.\n" +
   "   - Mantén un balance entre la exposición objetiva de los hechos y la expresión de la experiencia subjetiva del cliente en los ultimos hechos.\n" +
   "3. Formula una PETICIÓN efectiva:\n" +
   "   - Enfócate en los aspectos legalmente relevantes de la situación.\n" +
   "   - Hazla clara, concreta, contundente y bien fundamentada en los hechos presentados.\n" +
   "   - El objeto de la petición debe ser solicitar una solución específica al problema planteado.\n" +
   "   - Utiliza terminología legal apropiada.\n" +
   "   - No incluyas plazos ni términos específicos para la resolución del problema.\n" +
   "4. Crea una REFERENCIA corta y descriptiva para el caso, utilizando la categoria principal, que refleje la naturaleza jurídica de la reclamación.\n\n" +
   "Proporciona ÚNICAMENTE la siguiente información en el formato especificado:\n\n" +
   "EMPRESA DE SERVICIOS: [Nombre comercial de la empresa (Razón social)]\n\n" +
   "REFERENCIA: [Una referencia corta y descriptiva con enfoque jurídico]\n\n" +
   "HECHOS:\n[Enumera los hechos de manera concisa y jurídicamente relevante, incorporando elementos que reflejen el estado emocional del cliente de manera estratégica, sin introducción personal]\n\n" +
   "PETICIÓN:\n[Petición clara, concreta, contundente y fundamentada]\n\n" +
   "IMPORTANTE: No incluyas ninguna información adicional fuera de estos cuatro elementos. No inicies con presentaciones personales ni incluyas datos del cliente o leyes, que no sean estrictamente necesarios para la reclamación legal."
  )
};

class Agent {
  constructor(name, role, skills) {
    this.name = name;
    this.role = role;
    this.skills = skills;
    this.model = openAIModel;
    logger.info(`Agente creado: ${name} (${role}) usando modelo ${MODEL_NAME}`);
  }

  async performTask(task, data) {
    logger.info(`${this.name} iniciando tarea: ${task}`);
    const prompt = prompts[task];
    if (!prompt) {
      logger.error(`No hay prompt definido para la tarea: ${task}`);
      throw new Error(`No hay prompt definido para la tarea: ${task}`);
    }
    try {
      const chain = new LLMChain({ 
        llm: this.model, 
        prompt: prompt,
        verbose: true
      });
      
      // Log de la solicitud a OpenAI
      logger.debug(`Solicitud a OpenAI para ${task}:`);
      logger.debug(`Prompt: ${prompt.template}`);
      logger.debug(`Datos de entrada: ${JSON.stringify(data, null, 2)}`);

      const result = await chain.call(data);
      
      // Log de la respuesta de OpenAI
      logger.debug(`Respuesta de OpenAI para ${task}:`);
      logger.debug(result.text);
      
      return result.text;
    } catch (error) {
      logger.error(`Error en ${this.name} al realizar la tarea ${task}: ${error.message}`);
      throw error;
    }
  }
}

class ClassifierAndJuniorLawyer extends Agent {
  constructor() {
    super("Clasificador y Abogado Junior", "Analista y Preparador", ["clasificación de casos", "análisis inicial", "borrador básico"]);
  }

  async performTask(task, conversation) {
    if (task === "classify_and_prepare_draft") {
      const conversationString = typeof conversation === 'string' ? conversation : JSON.stringify(conversation);
      return super.performTask("classifyAndPrepareDraft", { conversation: conversationString });
    }
  }
}

class VerifierAndSeniorLawyer extends Agent {
  constructor() {
    super("Verificador y Abogado Senior", "Revisor y Perfeccionador", ["verificación de datos", "redacción legal avanzada", "persuasión"]);
  }

  async performTask(task, data) {
    if (task === "verify_and_refine") {
      logger.debug(`VerifierAndSeniorLawyer recibió datos:`, data);
      try {
        const refinedContent = await super.performTask("verifyAndRefine", { 
          junior_analysis: data.draft,
          customer_data: JSON.stringify(data.customer_data)
        });
        logger.debug(`Contenido refinado:`, refinedContent);
        return refinedContent;
      } catch (error) {
        logger.error(`Error en ${this.name} al verificar y refinar documento: ${error.message}`);
        throw error;
      }
    }
  }
}

class LegalAgentSystem {
  constructor() {
    this.classifierAndJuniorLawyer = new ClassifierAndJuniorLawyer();
    this.verifierAndSeniorLawyer = new VerifierAndSeniorLawyer();
    logger.info(`Sistema de Agentes Legales Fusionado inicializado usando modelo ${MODEL_NAME}`);
  }

  async processComplaint(conversation, customerData) {
    logger.info('Iniciando proceso de queja con agentes fusionados');
    try {
      logger.debug('Datos del cliente:', customerData);
      logger.debug('Conversación:', conversation);

      const draftResult = await this.classifierAndJuniorLawyer.performTask("classify_and_prepare_draft", conversation);
      logger.debug('Resultado del borrador:', draftResult);

      const refinedDocument = await this.verifierAndSeniorLawyer.performTask("verify_and_refine", {
        draft: draftResult,
        customer_data: customerData
      });
      logger.debug('Documento refinado:', refinedDocument);

      const documentContent = this.prepareDocumentContent(refinedDocument, customerData);
      logger.debug('Contenido del documento final:', documentContent);

      logger.info('Proceso de queja completado con éxito');
      return documentContent;
    } catch (error) {
      logger.error(`Error en el proceso de queja: ${error.message}`);
      throw error;
    }
  }

  prepareDocumentContent(content, customerData) {
    console.log('[prepareDocumentContent] Iniciando preparación del documento con customerData:', JSON.stringify(customerData, null, 2));

    if (!content || typeof content !== 'string') {
      console.error('[prepareDocumentContent] Error: content inválido');
      throw new Error('El contenido proporcionado no es válido');
    }

    if (!customerData || typeof customerData !== 'object') {
      console.error('[prepareDocumentContent] Error: customerData inválido');
      throw new Error('Los datos del cliente proporcionados no son válidos');
    }

    const { name, id, address, email, phone } = customerData;

    if (!name) {
      console.error('[prepareDocumentContent] Error: nombre del cliente no proporcionado');
      throw new Error('El nombre del cliente es requerido');
    }

    const documentContent = {
      companyName: this.extractCompanyName(content),
      reference: this.extractReference(content),
      customerName: name,
      customerId: id || '[ID NO PROPORCIONADO]',
      hechos: this.extractHechos(content),
      peticion: this.extractPeticion(content),
      address: address || '[DIRECCIÓN NO PROPORCIONADA]',
      email: email || '[EMAIL NO PROPORCIONADO]',
      phone: phone || '[TELÉFONO NO PROPORCIONADO]'
    };

    console.log('[prepareDocumentContent] Documento preparado:', JSON.stringify(documentContent, null, 2));

    return documentContent;
  }

  extractCompanyName(content) {
    console.log('[extractCompanyName] Extrayendo nombre de la empresa');
    const match = content.match(/EMPRESA DE SERVICIOS:\s*(.+)/);
    const companyName = match ? match[1].trim() : "Empresa de servicios de telecomunicaciones";
    console.log('[extractCompanyName] Nombre de empresa extraído:', companyName);
    return companyName;
  }

  extractReference(content) {
    console.log('[extractReference] Extrayendo referencia');
    const match = content.match(/REFERENCIA:\s*(.+)/);
    const reference = match ? match[1] : '[REFERENCIA NO ENCONTRADA]';
    console.log('[extractReference] Referencia extraída:', reference);
    return reference;
  }

  extractHechos(content) {
    console.log('[extractHechos] Extrayendo hechos');
    const hechosMatch = content.match(/HECHOS:([\s\S]*?)PETICIÓN:/);
    let hechos;
    if (hechosMatch) {
      hechos = hechosMatch[1].trim().split('\n').map(hecho => hecho.replace(/^\d+\.\s*/, '').trim());
    } else {
      console.warn('[extractHechos] No se encontraron hechos');
      hechos = ['[HECHOS NO ENCONTRADOS]'];
    }
    console.log('[extractHechos] Hechos extraídos:', hechos);
    return hechos;
  }

  extractPeticion(content) {
    console.log('[extractPeticion] Extrayendo petición');
    const peticionMatch = content.match(/PETICIÓN:([\s\S]*?)$/);
    const peticion = peticionMatch ? peticionMatch[1].trim() : '[PETICIÓN NO ENCONTRADA]';
    console.log('[extractPeticion] Petición extraída:', peticion);
    return peticion;
  }
}

module.exports = LegalAgentSystem;