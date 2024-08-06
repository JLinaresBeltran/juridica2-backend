const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require("langchain/prompts");
const { LLMChain } = require("langchain/chains");
const winston = require('winston');
const axios = require('axios');
const axiosRetry = require('axios-retry');

// Configuración del logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'agentetelefonia' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Configuración del modelo OpenAI
const MODEL_NAME = "gpt-3.5-turbo-0125";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("La clave API de OpenAI no está configurada en las variables de entorno.");
}

// Uso de Singleton para el modelo de OpenAI
const openAIModel = new ChatOpenAI({ 
  modelName: MODEL_NAME, 
  temperature: 0.7,
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

// Optimización del manejo de prompts
const prompts = {
  classifyAndPrepareDraft: PromptTemplate.fromTemplate(
    "Eres un abogado junior especializado en reclamaciones de servicios de telefonía. " +
    "Analiza la siguiente conversación y realiza estas tareas:\n" +
    "1. Clasifica el caso en una de estas categorías: Facturación, Calidad del Servicio, Contratación, Atención al Cliente, Otro.\n" +
    "2. Identifica la empresa de servicios mencionada en la conversación.\n" +
    "3. Extrae los datos relevantes para una reclamación.\n" +
    "4. Redacta un borrador básico pero coherente de los HECHOS, enumerándolos.\n" +
    "5. Formula una PETICIÓN inicial basada en los hechos identificados.\n\n" +
    "Conversación: {conversation}\n\n" +
    "Proporciona tu respuesta en el siguiente formato:\n" +
    "CATEGORÍA: [Categoría del caso]\n\n" +
    "EMPRESA DE SERVICIOS: [Nombre de la empresa]\n\n" +
    "DATOS RELEVANTES:\n[Lista de datos relevantes]\n\n" +
    "BORRADOR DE HECHOS:\n[Lista numerada de hechos]\n\n" +
    "BORRADOR DE PETICIÓN:\n[Petición inicial]"
  ),
  verifyAndRefine: PromptTemplate.fromTemplate(
    "Eres un abogado senior especializado en reclamaciones de servicios de telefonía. " +
    "Revisa y mejora el siguiente borrador de reclamación:\n\n" +
    "{draft}\n\n" +
    "Datos del cliente:\n{customer_data}\n\n" +
    "Realiza las siguientes tareas:\n" +
    "1. Verifica la precisión y completitud de los datos extraídos.\n" +
    "2. Corrige cualquier error o agrega datos faltantes.\n" +
    "3. Asegúrate de que la empresa de servicios esté correctamente identificada.\n" +
    "4. Refina la redacción para hacerla más persuasiva y profesional.\n" +
    "5. Asegúrate de que los HECHOS estén bien estructurados y sean coherentes.\n" +
    "6. Mejora la PETICIÓN para que sea clara y esté bien fundamentada.\n\n" +
    "Proporciona el contenido refinado en el siguiente formato:\n\n" +
    "EMPRESA DE SERVICIOS: [Nombre de la empresa]\n\n" +
    "REFERENCIA: [Una referencia corta y descriptiva]\n\n" +
    "HECHOS:\n[Aquí coloca los hechos numerados y refinados]\n\n" +
    "PETICIÓN:\n[Petición detallada y mejorada]"
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
    logger.info(`${this.name} intentando realizar tarea: ${task}`);
    const prompt = prompts[task];
    if (!prompt) {
      logger.error(`No hay prompt definido para la tarea: ${task}`);
      throw new Error(`No hay prompt definido para la tarea: ${task}`);
    }
    try {
      const chain = new LLMChain({ llm: this.model, prompt });
      const result = await chain.call(data);
      logger.debug(`Resultado de la tarea ${task}:`, result.text);
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
      return super.performTask("classifyAndPrepareDraft", { conversation: JSON.stringify(conversation) });
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
          draft: data.draft,
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
      const draftResult = await this.classifierAndJuniorLawyer.performTask("classify_and_prepare_draft", conversation);
      const refinedDocument = await this.verifierAndSeniorLawyer.performTask("verify_and_refine", {
        draft: draftResult,
        customer_data: customerData
      });

      const documentContent = this.prepareDocumentContent(refinedDocument, customerData);

      logger.info('Proceso de queja completado con éxito');
      return documentContent;
    } catch (error) {
      logger.error(`Error en el proceso de queja: ${error.message}`);
      throw error;
    }
  }

  prepareDocumentContent(content, customerData) {
    return {
      companyName: this.extractCompanyName(content),
      reference: this.extractReference(content),
      customerName: customerData.name,
      customerId: customerData.id,
      hechos: this.extractHechos(content),
      peticion: this.extractPeticion(content),
      address: customerData.address,
      email: customerData.email,
      phone: customerData.phone
    };
  }

  extractCompanyName(content) {
    const match = content.match(/EMPRESA DE SERVICIOS:\s*(.+)/);
    return match ? match[1].trim() : "Empresa de servicios de telecomunicaciones";
  }

  extractReference(content) {
    const match = content.match(/REFERENCIA:\s*(.+)/);
    return match ? match[1] : '[REFERENCIA NO ENCONTRADA]';
  }

  extractHechos(content) {
    const hechosMatch = content.match(/HECHOS:([\s\S]*?)PETICIÓN:/);
    if (hechosMatch) {
      return hechosMatch[1].trim().split('\n').map(hecho => hecho.replace(/^\d+\.\s*/, '').trim());
    }
    return ['[HECHOS NO ENCONTRADOS]'];
  }

  extractPeticion(content) {
    const peticionMatch = content.match(/PETICIÓN:([\s\S]*?)$/);
    return peticionMatch ? peticionMatch[1].trim() : '[PETICIÓN NO ENCONTRADA]';
  }
}

module.exports = LegalAgentSystem;