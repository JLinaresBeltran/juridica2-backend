const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Document } = require("langchain/document");
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;



function preprocesarTexto(texto) {
  return texto
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, '\n')
    .trim();
}

function limpiarContenido(contenido) {
  return contenido
    .replace(/[^\w\s.,;:()¿?¡!°\-\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dividirEnArticulos(texto, nombreArchivo) {
  const expresionRegularArticulo = /(?:ARTICULO|ARTÍCULO|Art\.)\s*(\d+[A-Z]?)\.?\s*(.*?)(?=(?:\n\s*(?:ARTICULO|ARTÍCULO|Art\.)\s*\d+|$))/gis;
  const articulos = [];
  let coincidencia;
  let contenidoAnterior = '';
  let numeroEsperado = 1;

  while ((coincidencia = expresionRegularArticulo.exec(texto)) !== null) {
    const numero = coincidencia[1];
    let contenido = coincidencia[2].trim();
    
    // Incluir el contenido que está entre artículos (como títulos de capítulos)
    if (contenidoAnterior) {
      articulos.push({
        numero: 'N/A',
        contenido: contenidoAnterior,
        fuente: nombreArchivo
      });
      console.log(`Contenido intermedio añadido: ${contenidoAnterior.substring(0, 50)}...`);
    }

    // Verificar si el número del artículo coincide con el esperado
    if (parseInt(numero) !== numeroEsperado) {
      console.warn(`Advertencia: Número de artículo inesperado. Esperado: ${numeroEsperado}, Encontrado: ${numero}`);
    }

    // Limpiar y añadir el artículo actual
    contenido = limpiarContenido(contenido);

    if (contenido || numero) {
      articulos.push({
        numero,
        contenido,
        fuente: nombreArchivo
      });
      console.log(`Artículo ${numero} añadido. Contenido: ${contenido.substring(0, 50)}...`);
    }

    numeroEsperado = parseInt(numero) + 1;
    contenidoAnterior = '';
  }

  // Añadir cualquier contenido restante después del último artículo
  const contenidoRestante = texto.slice(expresionRegularArticulo.lastIndex).trim();
  if (contenidoRestante) {
    articulos.push({
      numero: 'N/A',
      contenido: limpiarContenido(contenidoRestante),
      fuente: nombreArchivo
    });
    console.log(`Contenido restante añadido: ${contenidoRestante.substring(0, 50)}...`);
  }

  return articulos;
}

async function dividirDocumento(texto, nombreArchivo) {
  const articulosProblematicos = [];
  const textoLimpio = preprocesarTexto(texto);
  const articulos = dividirEnArticulos(textoLimpio, nombreArchivo);
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 750,
    chunkOverlap: 150,
  });

  let segmentos = [];

  for (const articulo of articulos) {
    try {
      if (!articulo.contenido && articulo.numero !== 'N/A') {
        console.warn(`Advertencia: Artículo ${articulo.numero} en ${nombreArchivo} está vacío.`);
        articulosProblematicos.push({ 
          numero: articulo.numero, 
          razon: 'Contenido vacío después de la limpieza',
          contenidoOriginal: textoLimpio.match(new RegExp(`(?:ARTICULO|ARTÍCULO|Art\.)\\s*${articulo.numero}[o°]?\\.?\\s*(.*?)(?=(?:\\n\\s*(?:ARTICULO|ARTÍCULO|Art\\.)\\s*\\d+|$))`, 'is'))?.[1] || 'No encontrado'
        });
        continue;
      }

      const subSegmentos = await splitter.createDocuments([articulo.contenido]);
      
      if (subSegmentos.length === 0) {
        console.warn(`Advertencia: No se generaron segmentos para el Artículo ${articulo.numero} en ${nombreArchivo}.`);
        articulosProblematicos.push({ numero: articulo.numero, razon: 'No se generaron segmentos' });
        continue;
      }

      const articuloSegmentos = subSegmentos.map((seg, index) => {
        if (!seg.pageContent) {
          console.warn(`Advertencia: Segmento vacío generado para el Artículo ${articulo.numero} en ${nombreArchivo}.`);
          return null;
        }
        return new Document({
          pageContent: `ARTICULO ${articulo.numero}. ${seg.pageContent}`,
          metadata: {
            fuente: nombreArchivo,
            numeroArticulo: articulo.numero,
            segmentoIndex: index,
            totalSegmentos: subSegmentos.length,
            esArticuloCompleto: subSegmentos.length === 1,
            id: uuidv4() // Generamos un UUID único para cada segmento
          }
        });
      }).filter(Boolean); // Eliminar segmentos nulos

      segmentos.push(...articuloSegmentos);

      console.log(`Procesado: Artículo ${articulo.numero} en ${nombreArchivo}. Generados ${articuloSegmentos.length} segmentos.`);
    } catch (error) {
      console.error(`Error al procesar artículo ${articulo.numero} en ${nombreArchivo}:`, error.message);
      articulosProblematicos.push({ 
        numero: articulo.numero, 
        razon: error.message, 
        contenido: articulo.contenido.substring(0, 100) + '...' // Primeros 100 caracteres para referencia
      });
    }
  }

  if (articulosProblematicos.length > 0) {
    console.log(`Artículos problemáticos en ${nombreArchivo}:`, JSON.stringify(articulosProblematicos, null, 2));
  }

  console.log(`Total de segmentos generados para ${nombreArchivo}: ${segmentos.length}`);

  return segmentos;
}

async function cargarYProcesarDocumentos(directorio) {
  const loader = new DirectoryLoader(
    directorio,
    {
      ".txt": (path) => new TextLoader(path),
    }
  );
  const documentosCargados = await loader.load();
  
  let documentosProcesados = [];
  for (const doc of documentosCargados) {
    console.log(`Procesando documento: ${doc.metadata.source}`);
    try {
      const segmentos = await dividirDocumento(doc.pageContent, doc.metadata.source);
      documentosProcesados.push(...segmentos);
      console.log(`Procesado exitosamente: ${doc.metadata.source}, ${segmentos.length} segmentos generados.`);
    } catch (error) {
      console.error(`Error al procesar documento ${doc.metadata.source}:`, error);
    }
  }
  
  return documentosProcesados;
}

module.exports = { cargarYProcesarDocumentos, dividirEnArticulos, dividirDocumento };