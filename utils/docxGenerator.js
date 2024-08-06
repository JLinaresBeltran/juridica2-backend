const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs').promises;

class DocxGenerator {
  constructor() {
    this.document = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Arial",
              size: 28, // 14 puntos * 2
            },
          },
        },
      },
      sections: [{
        properties: {},
        children: []
      }]
    });
  }

  addParagraph(text, options = {}) {
    const paragraph = new Paragraph({
      children: [new TextRun(text)],
      spacing: { after: 0 }, // Elimina el espacio después del párrafo
      ...options
    });
    this.document.addParagraph(paragraph);
  }

  addHeading(text, level = HeadingLevel.HEADING_1, alignment = AlignmentType.CENTER) {
    this.addParagraph(text, { 
      heading: level,
      alignment: alignment,
      spacing: { before: 200, after: 200 }
    });
  }

  addJustifiedParagraph(text) {
    this.addParagraph(text, { alignment: AlignmentType.JUSTIFIED });
  }

  addNumberedParagraph(text, level = 0) {
    this.addParagraph(text, { 
      numbering: {
        reference: "myNumbering",
        level: level,
      },
    });
  }

  generateComplaintDocument(content) {
    console.log('Generando documento de queja con contenido:', JSON.stringify(content, null, 2));

    this.document.createNumbering({
      reference: "myNumbering",
      levels: [
        {
          level: 0,
          format: "decimal",
          text: "%1.",
          alignment: AlignmentType.START,
          style: {
            paragraph: {
              indent: { left: 720, hanging: 360 }
            },
          },
        },
      ],
    });

    this.addParagraph("Señores", { alignment: AlignmentType.LEFT });
    this.addParagraph(content.companyName || "Empresa de servicios de telecomunicaciones", { bold: true });
    this.addParagraph("Empresa de servicios de telecomunicaciones");

    this.addParagraph(`Referencia: ${content.reference || "Sin referencia"}`, { bold: true });

    this.addParagraph("Respetados Señores:");

    this.addJustifiedParagraph(`${content.customerName || "Cliente"}, identificado con cédula de ciudadanía número ${content.customerId || new TextRun({text: "Aquí se coloca el No. de identificación", bold: true})}, en mi calidad de usuario, me dirijo a ustedes para presentar una reclamación en los términos de la Resolución No. 5111 de 2017, "Por la cual se establece el Régimen de Protección de los Derechos de los Usuarios de Servicios de Comunicaciones". Los hechos que motivan mi reclamación son los siguientes:`);

    this.addHeading("HECHOS", HeadingLevel.HEADING_1, AlignmentType.CENTER);

    if (Array.isArray(content.hechos) && content.hechos.length > 0) {
      content.hechos.forEach((hecho, index) => {
        this.addNumberedParagraph(hecho);
      });
    } else {
      this.addParagraph("No se proporcionaron hechos.");
    }

    this.addHeading("PETICIÓN", HeadingLevel.HEADING_1, AlignmentType.CENTER);

    this.addJustifiedParagraph(content.peticion || "No se proporcionó petición.");

    this.addHeading("NOTIFICACIONES", HeadingLevel.HEADING_1, AlignmentType.CENTER);

    let notificationText = "Para efectos de notificaciones y demás comunicaciones relacionadas con el presente trámite, solicito que se me notifique ";

    if (content.address) {
      notificationText += `tanto de forma física en mi dirección ${content.address}, `;
    } else {
      notificationText += "tanto de forma física en mi dirección ";
      notificationText += new TextRun({ text: "aquí se debe colocar la dirección física", bold: true }).text + ", ";
    }

    if (content.email) {
      notificationText += `como de forma electrónica en mi correo electrónico ${content.email}. `;
    } else {
      notificationText += "como de forma electrónica en mi correo electrónico [Correo electrónico no proporcionado]. ";
    }

    if (content.phone) {
      notificationText += `Adicionalmente, pueden contactarme en mi teléfono celular ${content.phone} para enterarme de la respuesta.`;
    }

    this.addJustifiedParagraph(notificationText);

    // Datos del cliente (solo si se proporcionan)
    if (content.customerName || content.customerId || content.email || content.phone || content.address) {
      this.addParagraph("Datos del cliente:", { bold: true });
      if (content.customerName) this.addParagraph(`Nombre: ${content.customerName}`);
      if (content.customerId) this.addParagraph(`Cédula: ${content.customerId}`);
      if (content.email) this.addParagraph(`Email: ${content.email}`);
      if (content.phone) this.addParagraph(`Teléfono: ${content.phone}`);
      if (content.address) {
        this.addParagraph(`Dirección: ${content.address}`);
      } else {
        this.addParagraph(new TextRun({ text: "Dirección: aquí se debe colocar la dirección física", bold: true }));
      }
    }

    this.addJustifiedParagraph("Agradezco su atención y quedaré atento a su pronta y oportuna respuesta.");

    // Agregar espacios antes de la firma
    this.addParagraph("");
    this.addParagraph("");
    this.addParagraph("");

    this.addParagraph(content.customerName || "Cliente", { bold: true });
    this.addParagraph(`C.C. ${content.customerId || new TextRun({ text: "Aquí se coloca el No. de identificación", bold: true }).text}`);
    this.addParagraph(`Número de celular: ${content.phone || "No proporcionado"}`);
  }

  async saveDocument(outputPath) {
    try {
      const buffer = await this.document.save();
      await fs.writeFile(outputPath, buffer);
      console.log(`Documento DOCX generado y guardado en: ${outputPath}`);
    } catch (error) {
      console.error('Error al guardar el documento DOCX:', error);
      throw error;
    }
  }
}

async function generateComplaintDocx(content, outputPath) {
  try {
    const generator = new DocxGenerator();
    generator.generateComplaintDocument(content);
    await generator.saveDocument(outputPath);
  } catch (error) {
    console.error('Error al generar el documento de queja:', error);
    throw error;
  }
}

module.exports = {
  DocxGenerator,
  generateComplaintDocx
};