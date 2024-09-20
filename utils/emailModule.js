const { HNSWLib } = require('langchain/vectorstores/hnswlib');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { Document } = require('langchain/document');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const path = require('path');
const fs = require('fs').promises;
const { dividirEnArticulos } = require('../utils/procesadorTextoLegal');

class AlmacenamientoVectorial {
  constructor() {
    if (AlmacenamientoVectorial.instance) {
      return AlmacenamientoVectorial.instance;
    }
    AlmacenamientoVectorial.instance = this;

    this._vectorStore = null;
    this.embeddings = new OpenAIEmbeddings();
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    this.inicializacionPromise = null;
    this.inicializacionCompletada = false;
    this.progresoPath = path.join(__dirname, '..', 'data', 'progreso.json');
    this.vectorStorePath = path.join(__dirname, '..', 'data', 'almacenamiento_vectorial');
    this.estadoPath = path.join(__dirname, '..', 'data', 'estado_almacenamiento.json');
  }

  async inicializar() {
    if (this.inicializacionCompletada) {
      console.log('La inicialización ya se completó anteriormente.');
      return this._vectorStore;
    }

    if (!this.inicializacionPromise) {
      this.inicializacionPromise = this._inicializar();
    }

    return this.inicializacionPromise;
  }

  async _inicializar() {
    try {
      const estado = await this.cargarEstado();

      if (estado.inicializacionCompletada) {
        console.log('Cargando almacenamiento vectorial existente...');
        this._vectorStore = await HNSWLib.load(this.vectorStorePath, this.embeddings);
      } else {
        console.log('Creando nuevo almacenamiento vectorial...');
        const documents = await this.procesarDocumentosGradualmente();
        if (documents.length === 0) {
          throw new Error('No se encontraron documentos para procesar.');
        }
        this._vectorStore = await HNSWLib.fromDocuments(documents, this.embeddings);
        await this._vectorStore.save(this.vectorStorePath);
        await this.guardarEstado({ inicializacionCompletada: true });
      }

      if (!this._vectorStore || !this._vectorStore.index) {
        throw new Error('No se pudo inicializar el almacenamiento vectorial correctamente.');
      }

      this.inicializacionCompletada = true;
      console.log('Inicialización completada.');
      return this._vectorStore;
    } catch (error) {
      console.error('Error durante la inicialización:', error);
      throw error;
    }
  }

  async cargarEstado() {
    try {
      const data = await fs.readFile(this.estadoPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { inicializacionCompletada: false };
    }
  }

  async guardarEstado(estado) {
    await fs.writeFile(this.estadoPath, JSON.stringify(estado, null, 2));
  }

  async procesarDocumentosGradualmente() {
    const baseDir = path.join(__dirname, '..', 'data');
    const categorias = ['codigos_generales', 'codigos_especiales', 'constitucion'];
    let progreso = await this.cargarProgreso();
    let documentosProcesados = [];

    for (const categoria of categorias) {
      const rutaCategoria = path.join(baseDir, categoria);
      try {
        await fs.access(rutaCategoria);
        const archivos = await fs.readdir(rutaCategoria);
        for (const archivo of archivos) {
          if (!progreso[categoria] || !progreso[categoria][archivo]) {
            const nuevosDocumentos = await this.procesarArchivo(rutaCategoria, archivo, categoria);
            documentosProcesados.push(...nuevosDocumentos);
            progreso[categoria] = progreso[categoria] || {};
            progreso[categoria][archivo] = true;
          } else {
            console.log(`Saltando archivo ya procesado: ${archivo}`);
          }
        }
      } catch (error) {
        console.error(`Error al procesar la categoría ${categoria}:`, error.message);
      }
    }

    await this.guardarProgreso(progreso);

    if (documentosProcesados.length === 0) {
      console.log('No se procesaron nuevos documentos. Reprocesando todos los documentos...');
      documentosProcesados = await this.reprocesarTodosLosDocumentos();
    }

    console.log(`Total de documentos procesados: ${documentosProcesados.length}`);
    return documentosProcesados;
  }

  async reprocesarTodosLosDocumentos() {
    const baseDir = path.join(__dirname, '..', 'data');
    const categorias = ['codigos_generales', 'codigos_especiales', 'constitucion'];
    let documentosProcesados = [];
    
    for (const categoria of categorias) {
      const rutaCategoria = path.join(baseDir, categoria);
      try {
        await fs.access(rutaCategoria);
        const archivos = await fs.readdir(rutaCategoria);
        for (const archivo of archivos) {
          const nuevosDocumentos = await this.procesarArchivo(rutaCategoria, archivo, categoria);
          documentosProcesados.push(...nuevosDocumentos);
        }
      } catch (error) {
        console.error(`Error al reprocesar la categoría ${categoria}:`, error.message);
      }
    }
    
    await this.guardarProgreso({});
    console.log(`Total de documentos reprocesados: ${documentosProcesados.length}`);
    return documentosProcesados;
  }

  async procesarArchivo(rutaCategoria, archivo, categoria) {
    const rutaArchivo = path.join(rutaCategoria, archivo);
    const documentosProcesados = [];
    try {
      const contenido = await fs.readFile(rutaArchivo, 'utf8');
      const articulos = dividirEnArticulos(contenido, archivo);

      for (const articulo of articulos) {
        const documento = new Document({
          pageContent: articulo.contenido,
          metadata: {
            fuente: articulo.fuente,
            categoria: categoria,
            numeroArticulo: articulo.numero
          }
        });

        const chunks = await this.textSplitter.splitDocuments([documento]);
        documentosProcesados.push(...chunks);
        console.log(`Procesado: ${archivo}, Artículo ${articulo.numero}, ${chunks.length} chunks`);
      }
    } catch (error) {
      console.error(`Error al procesar el archivo ${archivo}:`, error.message);
    }
    return documentosProcesados;
  }

  async cargarProgreso() {
    try {
      const data = await fs.readFile(this.progresoPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  async guardarProgreso(progreso) {
    await fs.writeFile(this.progresoPath, JSON.stringify(progreso, null, 2));
  }

  async buscarSimilares(consulta, k = 5) {
    if (!this._vectorStore) {
      throw new Error('Almacenamiento vectorial no inicializado');
    }
    
    console.log(`Búsqueda de documentos similares para la consulta: "${consulta}"`);
    
    const palabrasClave = this.extraerPalabrasClave(consulta);
    console.log('Palabras clave extraídas:', palabrasClave);
    
    const resultados = await this._vectorStore.similaritySearch(consulta, k * 2);
    console.log(`Se encontraron ${resultados.length} resultados iniciales.`);
    
    const resultadosFiltrados = resultados
      .filter(doc => this.contieneAlgunaPalabraClave(doc.pageContent, palabrasClave))
      .sort((a, b) => this.calcularRelevancia(b, palabrasClave) - this.calcularRelevancia(a, palabrasClave))
      .slice(0, k);
    
    console.log(`Se seleccionaron ${resultadosFiltrados.length} resultados después del filtrado y ordenamiento.`);
    
    const resultadosFormateados = resultadosFiltrados.map(doc => ({
      contenido: doc.pageContent,
      metadata: doc.metadata,
      citacion: `${doc.metadata.fuente}, Artículo ${doc.metadata.numeroArticulo}`,
      relevancia: this.calcularRelevancia(doc, palabrasClave)
    }));
    
    console.log('Resultados formateados:', JSON.stringify(resultadosFormateados, null, 2));
    
    return resultadosFormateados;
  }

  extraerPalabrasClave(consulta) {
    return consulta.toLowerCase().split(/\s+/)
      .filter(palabra => palabra.length > 3)
      .filter(palabra => !['para', 'como', 'esto', 'esos', 'estas', 'cual', 'cuales', 'donde', 'cuando'].includes(palabra));
  }

  contieneAlgunaPalabraClave(texto, palabrasClave) {
    return palabrasClave.some(palabra => texto.toLowerCase().includes(palabra));
  }

  calcularRelevancia(documento, palabrasClave) {
    return palabrasClave.reduce((count, palabra) => 
      count + (documento.pageContent.toLowerCase().match(new RegExp(palabra, 'g')) || []).length, 0);
  }

  get vectorStore() {
    return this._vectorStore;
  }

  set vectorStore(value) {
    this._vectorStore = value;
  }
}

module.exports = new AlmacenamientoVectorial();