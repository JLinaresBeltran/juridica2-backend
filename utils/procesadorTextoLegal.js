const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Document } = require("langchain/document");
const path = require('path');
const fs = require('fs').promises;

function dividirEnArticulos(texto, nombreArchivo) {
  const expresionRegularArticulo = /ARTICULO\s+(\d+)\.?\s+([\s\S]+?)(?=ARTICULO\s+\d+|$)/gi;
  const articulos = [];
  let coincidencia;

  while ((coincidencia = expresionRegularArticulo.exec(texto)) !== null) {
    articulos.push({
      numero: coincidencia[1],
      contenido: coincidencia[2].trim(),
      fuente: nombreArchivo
    });
  }

  return articulos;
}

async function dividirDocumento(texto, nombreArchivo) {
  const articulos = dividirEnArticulos(texto, nombreArchivo);
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  let segmentos = [];
  for (const articulo of articulos) {
    if (articulo.contenido.length > 1000) { // Si el artículo es largo, lo dividimos
      const subSegmentos = await splitter.createDocuments([articulo.contenido]);
      segmentos.push(...subSegmentos.map(seg => ({
        ...seg,
        metadata: {
          ...seg.metadata,
          fuente: articulo.fuente,
          numeroArticulo: articulo.numero
        }
      })));
    } else {
      segmentos.push(new Document({
        pageContent: articulo.contenido,
        metadata: {
          fuente: articulo.fuente,
          numeroArticulo: articulo.numero
        }
      }));
    }
  }

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
    const segmentos = await dividirDocumento(doc.pageContent, doc.metadata.source);
    documentosProcesados.push(...segmentos);
  }
  
  return documentosProcesados;
}

module.exports = { cargarYProcesarDocumentos, dividirEnArticulos, dividirDocumento };