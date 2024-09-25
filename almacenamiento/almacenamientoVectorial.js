const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { HNSWLib } = require('langchain/vectorstores/hnswlib');
const { Document } = require('langchain/document');
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
    this.inicializacionPromise = null;
    this.inicializacionCompletada = false;
    this.progresoPath = path.join(__dirname, '..', 'data', 'progreso.json');
    this.vectorStorePath = path.join(__dirname, '..', 'data', 'almacenamiento_vectorial');

    console.log("Ruta del almacenamiento vectorial:", this.vectorStorePath);

    this.articulosCompletos = {};
    this.codigosIndexados = new Set();
    this.timestamps = {};  // Para almacenar los timestamps de archivos procesados
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
    try {
      await fs.mkdir(path.dirname(this.vectorStorePath), { recursive: true });
      await this.cargarOCrearAlmacenamiento();
      await this.cargarArticulosCompletos();
      await this.procesarDocumentosGradualmente();
      this.inicializacionCompletada = true;
      console.log('Inicialización completada.');
      await this.contarDocumentos();
      await this.diagnosticoIndexacion();
    } catch (error) {
      console.error('Error durante la inicialización:', error);
      throw error;
    }
  }

  async cargarOCrearAlmacenamiento() {
    try {
      await fs.mkdir(this.vectorStorePath, { recursive: true });
      
      if (await this.existeAlmacenamiento()) {
        console.log('Cargando almacenamiento vectorial existente...');
        this.vectorStore = await HNSWLib.load(this.vectorStorePath, this.embeddings);
      } else {
        console.log('Creando nuevo almacenamiento vectorial...');
        this.vectorStore = new HNSWLib(this.embeddings, {
          space: 'cosine',
          numDimensions: 1536
        });
      }
      
      // Asegurarse de que el directorio esté siempre establecido
      this.vectorStore.docstore.directory = this.vectorStorePath;
      console.log(`Directorio del almacenamiento vectorial: ${this.vectorStorePath}`);
    } catch (error) {
      console.error('Error al cargar o crear el almacenamiento vectorial:', error);
      throw error;
    }
  }

  async existeAlmacenamiento() {
    try {
      await fs.access(path.join(this.vectorStorePath, 'hnswlib.index'));
      return true;
    } catch {
      return false;
    }
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
          this.codigosIndexados.add(archivo);
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
            console.log(`Procesando archivo: ${archivo} en categoría: ${categoria}`);
            await this.procesarArchivo(rutaCategoria, archivo, categoria);
            progreso[categoria] = progreso[categoria] || {};
            progreso[categoria][archivo] = true;
            await this.guardarProgreso(progreso);
            await this.guardarAlmacenamiento();
          } else {
            console.log(`Saltando archivo ya procesado: ${archivo} en categoría: ${categoria}`);
          }
        }
      } catch (error) {
        console.error(`Error al procesar la categoría ${categoria}:`, error.message);
      }
    }
  }

  async guardarAlmacenamiento() {
    if (this.vectorStore) {
      try {
        await this.vectorStore.save(this.vectorStorePath);
        console.log(`Almacenamiento vectorial guardado en: ${this.vectorStorePath}`);
      } catch (error) {
        console.error('Error al guardar el almacenamiento vectorial:', error);
        throw error;
      }
    } else {
      console.warn('No se pudo guardar el almacenamiento vectorial porque está vacío o no inicializado.');
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
            fuente: archivo,
            categoria: categoria,
            numeroArticulo: articulo.numero
          }
        });

        try {
          await this.vectorStore.addDocuments([documento]);
          console.log(`Procesado: ${archivo}, Artículo ${articulo.numero}`);
        } catch (error) {
          console.error(`Error al procesar artículo en ${archivo}, Artículo ${articulo.numero}:`, error.message);
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
      console.log('No se encontró archivo de progreso, creando uno nuevo.');
      return {};
    }
  }

  async guardarProgreso(progreso) {
    await fs.writeFile(this.progresoPath, JSON.stringify(progreso, null, 2));
    console.log('Progreso guardado.');
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
    
    const resultados = await this.vectorStore.similaritySearchWithScore(consulta, k * 2);
    
    console.log(`Se encontraron ${resultados.length} documentos similares`);
    
    const articulosUnicos = {};
    const categorias = new Set();
    
    resultados.forEach(([doc, score]) => {
      const clave = `${doc.metadata.fuente}-${doc.metadata.numeroArticulo}`;
      if (!articulosUnicos[clave] || score < articulosUnicos[clave].similaridad) {
        articulosUnicos[clave] = {
          contenido: this.articulosCompletos[clave] || doc.pageContent,
          metadata: doc.metadata,
          citacion: `${doc.metadata.fuente}, Artículo ${doc.metadata.numeroArticulo}`,
          similaridad: score
        };
        categorias.add(doc.metadata.categoria);
      }
    });
  
    const documentosFormateados = Object.values(articulosUnicos);
    documentosFormateados.sort((a, b) => a.similaridad - b.similaridad);
    
    const resultadosBalanceados = [];
    const categoriasArray = Array.from(categorias);
    let index = 0;
    while (resultadosBalanceados.length < k && index < documentosFormateados.length) {
      const categoriaActual = categoriasArray[index % categoriasArray.length];
      const documento = documentosFormateados.find(doc => doc.metadata.categoria === categoriaActual && !resultadosBalanceados.includes(doc));
      if (documento) {
        resultadosBalanceados.push(documento);
      }
      index++;
    }
    
    console.log("\nDocumentos similares encontrados (balanceados por categoría):");
    resultadosBalanceados.forEach((doc, index) => {
      const relevancia = (1 - doc.similaridad) * 100;
      console.log(`${index + 1}. ${doc.citacion}`);
      console.log(`   Categoría: ${doc.metadata.categoria}`);
      console.log(`   Relevancia: ${relevancia.toFixed(2)}%`);
      console.log(`   Similaridad: ${doc.similaridad.toFixed(4)}`);
      console.log(`   Contenido: ${doc.contenido.substring(0, 100)}...`);
      console.log('');
    });
    
    return resultadosBalanceados;
  }

  async diagnosticoIndexacion() {
    if (!this.vectorStore) {
      console.error('El almacenamiento vectorial no está inicializado');
      return;
    }

    const categorias = ['codigos_generales', 'codigos_especiales', 'constitucion'];
    const estadisticas = {};

    const todosLosDocumentos = await this.vectorStore.similaritySearch("", 1000);

    for (const categoria of categorias) {
      const documentosEnCategoria = todosLosDocumentos.filter(doc => 
        doc.metadata && doc.metadata.categoria === categoria
      );
      estadisticas[categoria] = documentosEnCategoria.length;
    }

    console.log('Estadísticas de indexación:');
    console.log(JSON.stringify(estadisticas, null, 2));

    const totalDocumentos = Object.values(estadisticas).reduce((a, b) => a + b, 0);
    console.log(`Total de documentos indexados: ${totalDocumentos}`);

    const documentosSinCategoria = todosLosDocumentos.filter(doc => 
      !doc.metadata || !doc.metadata.categoria
    );
    if (documentosSinCategoria.length > 0) {
      console.log(`Advertencia: Se encontraron ${documentosSinCategoria.length} documentos sin categoría.`);
    }

    const desglosePorFuente = {};
    todosLosDocumentos.forEach(doc => {
      if (doc.metadata && doc.metadata.fuente) {
        if (!desglosePorFuente[doc.metadata.fuente]) {
          desglosePorFuente[doc.metadata.fuente] = {
            count: 0,
            articulos: []
          };
        }
        desglosePorFuente[doc.metadata.fuente].count++;
        desglosePorFuente[doc.metadata.fuente].articulos.push(doc.metadata.numeroArticulo);
      }
    });
    console.log('Desglose por fuente:');
    for (const [fuente, info] of Object.entries(desglosePorFuente)) {
      console.log(`${fuente}: ${info.count} documentos`);
      console.log(`  Artículos: ${info.articulos.sort((a, b) => {
        const aNum = parseInt(a.replace(/[^0-9]/g, ''));
        const bNum = parseInt(b.replace(/[^0-9]/g, ''));
        return aNum - bNum || a.localeCompare(b);
      }).join(', ')}`);
    }
  }

  // Método modificado para verificar cambios en archivos antes de reindexar
  async agregarCodigo(rutaArchivo, categoria) {
    try {
      const baseDir = path.resolve(__dirname, '..');
      const rutaCompleta = path.join(baseDir, rutaArchivo);
      const nombreArchivo = path.basename(rutaCompleta);

      console.log(`Intentando acceder al archivo: ${rutaCompleta}`);

      try {
        await fs.access(rutaCompleta);
      } catch (error) {
        console.error(`El archivo no existe o no se puede acceder: ${rutaCompleta}`);
        throw new Error(`No se puede acceder al archivo: ${error.message}`);
      }

      const stats = await fs.stat(rutaCompleta);
      const lastModified = stats.mtimeMs;
      
      if (this.codigosIndexados.has(nombreArchivo) && this.timestamps[nombreArchivo] === lastModified) {
        console.log(`El código ${nombreArchivo} ya está indexado y no ha sido modificado.`);
        return;
      }

      console.log(`Agregando o actualizando código: ${nombreArchivo}`);

      // Leer el contenido del archivo
      const contenido = await fs.readFile(rutaCompleta, 'utf8');

      // Usar dividirEnArticulos en lugar de cargarYProcesarDocumentos
      const articulos = dividirEnArticulos(contenido, nombreArchivo);

      if (articulos.length === 0) {
        throw new Error(`No se encontraron artículos en ${nombreArchivo}`);
      }

      // Procesar y agregar cada artículo al almacenamiento vectorial
      for (const articulo of articulos) {
        const documento = new Document({
          pageContent: articulo.contenido,
          metadata: {
            fuente: nombreArchivo,
            categoria: categoria,
            numeroArticulo: articulo.numero,
            id: `${nombreArchivo}-${articulo.numero}`
          }
        });

        await this.vectorStore.addDocuments([documento]);
        console.log(`Procesado: ${nombreArchivo}, Artículo ${articulo.numero}`);

        // Actualizar articulosCompletos
        const clave = `${nombreArchivo}-${articulo.numero}`;
        this.articulosCompletos[clave] = articulo.contenido;
      }

      // Actualizar codigosIndexados y timestamps
      this.codigosIndexados.add(nombreArchivo);
      this.timestamps[nombreArchivo] = lastModified;

      // Actualizar progreso
      let progreso = await this.cargarProgreso();
      progreso[categoria] = progreso[categoria] || {};
      progreso[categoria][nombreArchivo] = true;
      await this.guardarProgreso(progreso);

      // Guardar el almacenamiento vectorial
      await this.guardarAlmacenamiento();

      console.log(`Código ${nombreArchivo} agregado o actualizado exitosamente.`);
    } catch (error) {
      console.error(`Error al agregar código ${path.basename(rutaArchivo)}:`, error);
      throw error;
    }
  }


  async eliminarCodigo(nombreArchivo) {
    if (!this.codigosIndexados.has(nombreArchivo)) {
      console.log(`El código ${nombreArchivo} no está indexado.`);
      return;
    }
  
    console.log(`Eliminando código: ${nombreArchivo}`);
  
    // Verificación de la existencia de 'hnswlib.index'
    const indexFilePath = path.join(this.vectorStorePath, 'hnswlib.index');
    try {
      await fs.access(indexFilePath);
      console.log("El archivo hnswlib.index existe en la ruta:", indexFilePath);
    } catch (error) {
      console.error("No se encontró el archivo hnswlib.index en la ruta:", indexFilePath);
      return;
    }  
    
    try {
      // Buscar documentos a eliminar
      const documentosAEliminar = await this.vectorStore.similaritySearch(`fuente:${nombreArchivo}`, 1000);
      console.log(`Se encontraron ${documentosAEliminar.length} documentos para eliminar.`);
      
      // Eliminar documentos del almacenamiento vectorial
      for (const doc of documentosAEliminar) {
        if (doc.id !== undefined) {
          await this.vectorStore.delete({ ids: [doc.id] });
        } else {
          console.warn(`Documento sin ID encontrado: ${JSON.stringify(doc.metadata)}`);
        }
      }

      // Eliminar de articulosCompletos
      for (const clave in this.articulosCompletos) {
        if (clave.startsWith(`${nombreArchivo}-`)) {
          delete this.articulosCompletos[clave];
        }
      }

      // Actualizar progreso
      let progreso = await this.cargarProgreso();
      for (const categoria in progreso) {
        if (progreso[categoria][nombreArchivo]) {
          delete progreso[categoria][nombreArchivo];
        }
      }
      await this.guardarProgreso(progreso);

      this.codigosIndexados.delete(nombreArchivo);
      
      // Guardar el almacenamiento vectorial después de la eliminación
      await this.guardarAlmacenamiento();

      console.log(`Código ${nombreArchivo} eliminado exitosamente.`);
    } catch (error) {
      console.error(`Error al eliminar el código ${nombreArchivo}:`, error);
      throw error;
    }
  }


  async actualizarCodigo(rutaArchivo, categoria) {
    try {
      const baseDir = path.resolve(__dirname, '..');
      const rutaCompleta = path.join(baseDir, rutaArchivo);
      const nombreArchivo = path.basename(rutaCompleta);
  
      console.log(`Intentando actualizar el archivo: ${rutaCompleta}`);
  
      if (!this.codigosIndexados.has(nombreArchivo)) {
        console.log(`El código ${nombreArchivo} no está indexado. Se procederá a agregarlo.`);
        return await this.agregarCodigo(rutaArchivo, categoria);
      }
  
      console.log(`Actualizando código: ${nombreArchivo}`);
  
      // Asegurarse de que el directorio esté establecido correctamente
      if (!this.vectorStore.docstore.directory) {
        this.vectorStore.docstore.directory = this.vectorStorePath;
        console.log(`Estableciendo directorio del almacenamiento vectorial: ${this.vectorStorePath}`);
      }
  
      // Intentar eliminar todos los documentos existentes para este archivo
      try {
        const idsAEliminar = Object.keys(this.articulosCompletos)
          .filter(key => key.startsWith(`${nombreArchivo}-`))
          .map(key => key);
  
        if (idsAEliminar.length > 0) {
          for (const id of idsAEliminar) {
            try {
              await this.vectorStore.delete({ ids: [id] });
              console.log(`Eliminado documento con ID: ${id}`);
              delete this.articulosCompletos[id];
            } catch (deleteError) {
              console.error(`Error al eliminar documento ${id}:`, deleteError);
            }
          }
        }
      } catch (deleteError) {
        console.error(`Error al eliminar documentos de ${nombreArchivo}:`, deleteError);
      }
  
      // Leer el contenido actualizado del archivo
      const contenido = await fs.readFile(rutaCompleta, 'utf8');
  
      // Procesar el contenido actualizado
      const articulos = dividirEnArticulos(contenido, nombreArchivo);
  
      // Crear y añadir nuevos documentos
      const nuevosDocumentos = [];
      for (const articulo of articulos) {
        const documento = new Document({
          pageContent: articulo.contenido,
          metadata: {
            fuente: nombreArchivo,
            categoria: categoria,
            numeroArticulo: articulo.numero,
            id: `${nombreArchivo}-${articulo.numero}`
          }
        });
  
        nuevosDocumentos.push(documento);
  
        // Actualizar articulosCompletos
        const clave = `${nombreArchivo}-${articulo.numero}`;
        this.articulosCompletos[clave] = articulo.contenido;
      }
  
      // Añadir nuevos documentos al almacenamiento vectorial
      await this.vectorStore.addDocuments(nuevosDocumentos);
      console.log(`Añadidos ${nuevosDocumentos.length} nuevos documentos para ${nombreArchivo}`);
  
      // Actualizar timestamp
      const stats = await fs.stat(rutaCompleta);
      this.timestamps[nombreArchivo] = stats.mtimeMs;
  
      // Actualizar progreso
      let progreso = await this.cargarProgreso();
      progreso[categoria] = progreso[categoria] || {};
      progreso[categoria][nombreArchivo] = true;
      await this.guardarProgreso(progreso);
  
      // Guardar el almacenamiento vectorial
      await this.guardarAlmacenamiento();
  
      console.log(`Código ${nombreArchivo} actualizado exitosamente.`);
    } catch (error) {
      console.error(`Error al actualizar código ${path.basename(rutaArchivo)}:`, error);
      throw error;
    }
  }
  
    async verificarDespuesDeActualizar(nombreArchivo) {
      const documentos = await this.vectorStore.similaritySearch(`metadata.fuente:"${nombreArchivo}"`, 1000);
      const conteoArticulos = {};
      
      documentos.forEach(doc => {
        const numeroArticulo = doc.metadata.numeroArticulo;
        conteoArticulos[numeroArticulo] = (conteoArticulos[numeroArticulo] || 0) + 1;
      });
    
      const duplicados = Object.entries(conteoArticulos)
        .filter(([, count]) => count > 1)
        .map(([articulo]) => articulo);
    
      if (duplicados.length > 0) {
        console.warn(`Se encontraron duplicados para los siguientes artículos: ${duplicados.join(', ')}`);
      } else {
        console.log(`No se encontraron duplicados para ${nombreArchivo}`);
      }
    
      console.log(`Total de documentos para ${nombreArchivo}: ${documentos.length}`);
    }
  }

module.exports = new AlmacenamientoVectorial();