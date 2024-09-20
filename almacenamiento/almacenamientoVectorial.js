const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { HNSWLib } = require('langchain/vectorstores/hnswlib');
const { Document } = require('langchain/document');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { dividirEnArticulos } = require('../utils/procesadorTextoLegal');
const path = require('path');
const fs = require('fs').promises;

class AlmacenamientoVectorial {
  constructor() {
    if (AlmacenamientoVectorial.instance) {
      return AlmacenamientoVectorial.instance;
    }
    AlmacenamientoVectorial.instance = this;

    this.vectorStore = null;
    this.embeddings = new OpenAIEmbeddings();
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });
    this.inicializacionPromise = null;
    this.inicializacionCompletada = false;
    this.progresoPath = path.join(__dirname, '..', 'data', 'progreso.json');
    this.articulosCompletos = {};
  }

  async inicializar() {
    if (this.inicializacionCompletada) {
      console.log('La inicialización ya se completó anteriormente.');
      return;
    }

    if (!this.inicializacionPromise) {
      this.inicializacionPromise = this._inicializar();
    }

    return this.inicializacionPromise;
  }

  async _inicializar() {
    const vectorStorePath = path.join(__dirname, '..', 'data', 'almacenamiento_vectorial');
    
    try {
      await fs.access(vectorStorePath);
      console.log('Cargando almacenamiento vectorial existente...');
      this.vectorStore = await HNSWLib.load(vectorStorePath, this.embeddings);
    } catch (error) {
      console.log('Creando nuevo almacenamiento vectorial...');
      this.vectorStore = await HNSWLib.fromDocuments([], this.embeddings);
      await this.procesarDocumentosGradualmente();
      if (this.vectorStore.index) {
        await this.vectorStore.save(vectorStorePath);
      } else {
        throw new Error('No se pudo inicializar el almacenamiento vectorial correctamente.');
      }
    }

    await this.cargarArticulosCompletos();
    this.inicializacionCompletada = true;
    console.log('Inicialización completada.');
    await this.contarDocumentos();
  }

  async cargarArticulosCompletos() {
    const baseDir = path.join(__dirname, '..', 'data');
    const categorias = ['codigos_generales', 'codigos_especiales', 'constitucion'];

    for (const categoria of categorias) {
      const rutaCategoria = path.join(baseDir, categoria);
      try {
        const archivos = await fs.readdir(rutaCategoria);
        for (const archivo of archivos) {
          const rutaArchivo = path.join(rutaCategoria, archivo);
          const contenido = await fs.readFile(rutaArchivo, 'utf8');
          const articulos = dividirEnArticulos(contenido, archivo);
          for (const articulo of articulos) {
            const clave = `${archivo}-${articulo.numero}`;
            this.articulosCompletos[clave] = articulo.contenido;
          }
        }
      } catch (error) {
        console.error(`Error al cargar artículos completos de ${categoria}:`, error.message);
      }
    }
    console.log("Artículos completos cargados en memoria.");
  }


  async procesarDocumentosGradualmente() {
    const baseDir = path.join(__dirname, '..', 'data');
    const categorias = ['codigos_generales', 'codigos_especiales', 'constitucion'];
    let progreso = await this.cargarProgreso();

    for (const categoria of categorias) {
      const rutaCategoria = path.join(baseDir, categoria);
      try {
        await fs.access(rutaCategoria);
        const archivos = await fs.readdir(rutaCategoria);
        for (const archivo of archivos) {
          if (!progreso[categoria] || !progreso[categoria][archivo]) {
            await this.procesarArchivo(rutaCategoria, archivo, categoria);
            progreso[categoria] = progreso[categoria] || {};
            progreso[categoria][archivo] = true;
            await this.guardarProgreso(progreso);
          } else {
            console.log(`Saltando archivo ya procesado: ${archivo}`);
          }
        }
      } catch (error) {
        console.error(`Error al procesar la categoría ${categoria}:`, error.message);
      }
    }
  }

  async procesarArchivo(rutaCategoria, archivo, categoria) {
    const rutaArchivo = path.join(rutaCategoria, archivo);
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
        
        for (const chunk of chunks) {
          try {
            await this.vectorStore.addDocuments([chunk]);
            console.log(`Procesado: ${archivo}, Artículo ${articulo.numero}, Chunk`);
          } catch (error) {
            console.error(`Error al procesar chunk en ${archivo}, Artículo ${articulo.numero}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error(`Error al procesar el archivo ${archivo}:`, error.message);
    }
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

  async contarDocumentos() {
    if (!this.vectorStore) {
      console.error('El almacenamiento vectorial no está inicializado');
      return;
    }
    const count = await this.vectorStore.index.getMaxElements();
    console.log(`Número total de documentos en el almacenamiento vectorial: ${count}`);
  }

  async buscarSimilares(consulta, k = 10) {
    if (!this.vectorStore) {
      throw new Error('Almacenamiento vectorial no inicializado');
    }
    
    console.log(`\nIniciando búsqueda para la consulta: "${consulta}"`);
    
    const resultados = await this.vectorStore.similaritySearchWithScore(consulta, k);
    
    console.log(`Se encontraron ${resultados.length} documentos similares`);
    
    const articulosUnicos = {};
    
    resultados.forEach(([doc, score]) => {
      const clave = `${doc.metadata.fuente}-${doc.metadata.numeroArticulo}`;
      if (!articulosUnicos[clave] || score < articulosUnicos[clave].similaridad) {
        articulosUnicos[clave] = {
          contenido: this.articulosCompletos[clave] || doc.pageContent,
          metadata: doc.metadata,
          citacion: `${doc.metadata.fuente}, Artículo ${doc.metadata.numeroArticulo}`,
          similaridad: score
        };
      }
    });
  
    const documentosFormateados = Object.values(articulosUnicos);
    documentosFormateados.sort((a, b) => a.similaridad - b.similaridad);
    
    // Limitamos a los 4 resultados más relevantes
    const resultadosLimitados = documentosFormateados.slice(0, 4);
    
    console.log("\nDocumentos similares encontrados (ordenados por relevancia):");
    resultadosLimitados.forEach((doc, index) => {
      const relevancia = (1 - doc.similaridad) * 100;
      console.log(`${index + 1}. ${doc.citacion}`);
      console.log(`   Relevancia: ${relevancia.toFixed(2)}%`);
      console.log(`   Similaridad: ${doc.similaridad.toFixed(4)}`);
      console.log(`   Contenido: ${doc.contenido.substring(0, 100)}...`);
      console.log('');
    });
    
    return resultadosLimitados;
  }
}

module.exports = new AlmacenamientoVectorial();