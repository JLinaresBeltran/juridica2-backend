const docx = require('docx');
const fs = require('fs').promises;

function sanitizeCustomerData(rawData) {
  console.log('Datos recibidos para sanitizar:', JSON.stringify(rawData, null, 2));
  const allowedFields = ['customerName', 'documentNumber', 'address', 'email', 'phone', 'companyName', 'reference', 'hechos', 'peticion'];
  const sanitizedData = {};

  for (const field of allowedFields) {
    if (rawData[field] && rawData[field] !== "undefined" && rawData[field] !== "") {
      sanitizedData[field] = rawData[field];
    }
  }

  console.log('Datos sanitizados:', JSON.stringify(sanitizedData, null, 2));
  return sanitizedData;
}

function processPetition(rawPetition) {
  if (typeof rawPetition !== 'string') return "No se proporcionó petición.";
  const petitionParts = rawPetition.split('Datos del cliente:');
  return petitionParts[0].trim();
}

async function generateDocx(rawContent, outputPath) {
  const content = sanitizeCustomerData(rawContent);
  console.log('Iniciando generación de documento DOCX con contenido sanitizado:', JSON.stringify(content, null, 2));

  const idText = content.documentNumber 
    ? `${content.documentNumber}`
    : "Aquí se coloca el No. de identificación";

  const idRun = new docx.TextRun({
    text: idText,
    bold: !content.documentNumber // Solo en negrita si es el texto placeholder
  });

  try {
    const doc = new docx.Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Arial",
              size: 28, // 14 puntos * 2
            },
          },
        },
        paragraphStyles: [
          {
            id: "normal",
            name: "Normal",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              font: "Arial",
              size: 28,
            },
            paragraph: {
              spacing: { line: 240, after: 0 }, // Interlineado sencillo
            },
          },
          {
            id: "justified",
            name: "Justified",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              font: "Arial",
              size: 28,
            },
            paragraph: {
              alignment: docx.AlignmentType.JUSTIFIED,
              spacing: { line: 240, after: 0 }, // Interlineado sencillo
            },
          },
          {
            id: "centered",
            name: "Centered",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              font: "Arial",
              size: 28,
              bold: true,
            },
            paragraph: {
              alignment: docx.AlignmentType.CENTER,
              spacing: { line: 240, before: 200, after: 200 }, // Espacio antes y después para los títulos
            },
          },
        ],
      },
      sections: [{
        properties: {},
        children: [
          new docx.Paragraph({
            children: [
              new docx.TextRun("Señores"),
              new docx.TextRun({
                text: content.companyName ? content.companyName.split('(')[0].trim() : "Empresa de servicios",
                bold: true,
                break: 1
              }),
              new docx.TextRun({
                text: content.companyName ? `(${content.companyName.split('(')[1] || ''})`.trim() : "de telecomunicaciones",
                break: 1
              }),
              new docx.TextRun({
                text: "Empresa de servicios de telecomunicaciones",
                break: 1
              })
            ],
            style: "normal",
            spacing: { after: 0, before: 0 }
          }),
          new docx.Paragraph({ text: "", style: "normal", spacing: { after: 0, before: 240 } }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "Referencia: ",
                bold: true
              }),
              new docx.TextRun(content.reference || "Sin referencia")
            ],
            style: "normal",
            spacing: { after: 0 }
          }),
          new docx.Paragraph({ text: "", style: "normal", spacing: { after: 0, before: 240 } }),
          new docx.Paragraph({
            text: "Respetados Señores:",
            style: "normal",
            spacing: { after: 0 }
          }),
          new docx.Paragraph({ text: "", style: "normal", spacing: { after: 0, before: 240 } }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `${content.customerName || "Cliente"}, `,
                bold: true
              }),
              new docx.TextRun(`identificado con cédula de ciudadanía número `),
              idRun,
              new docx.TextRun(`, en mi calidad de usuario, me dirijo a ustedes para presentar una reclamación en los términos de la Resolución No. 5111 de 2017, "Por la cual se establece el Régimen de Protección de los Derechos de los Usuarios de Servicios de Comunicaciones". Los hechos que motivan mi reclamación son los siguientes:`)
            ],
            style: "justified"
          }),
          new docx.Paragraph({
            text: "HECHOS",
            style: "centered"
          }),
          ...(Array.isArray(content.hechos) && content.hechos.length > 0 ? content.hechos.map((hecho, index) => 
            new docx.Paragraph({
              children: [
                new docx.TextRun({
                  text: `${index + 1}. `,
                  bold: true
                }),
                new docx.TextRun(hecho)
              ],
              style: "justified",
              spacing: { after: 240 }
            })
          ) : [new docx.Paragraph({ text: "No se proporcionaron hechos.", style: "normal" })]),
          new docx.Paragraph({
            text: "PETICIÓN",
            style: "centered"
          }),
          new docx.Paragraph({
            text: processPetition(content.peticion),
            style: "justified"
          }),
          new docx.Paragraph({
            text: "NOTIFICACIONES",
            style: "centered"
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun("Para efectos de notificaciones y demás comunicaciones relacionadas con el presente trámite, solicito que se me notifique tanto de forma física en mi dirección "),
              content.address ? 
                new docx.TextRun(content.address) :
                new docx.TextRun({
                  text: "aquí se debe colocar la dirección física",
                  bold: true
                }),
              new docx.TextRun(", y en mi correo electrónico "),
              content.email ?
                new docx.TextRun(content.email) :
                new docx.TextRun("[Correo electrónico no proporcionado]"),
              new docx.TextRun(". "),
              content.phone ?
                new docx.TextRun(`Adicionalmente, pueden contactarme en mi teléfono celular ${content.phone} para enterarme de la respuesta.`) :
                new docx.TextRun("")
            ],
            style: "justified"
          }),
          new docx.Paragraph({ text: "", style: "normal" }),
          new docx.Paragraph({
            text: "Agradezco su atención y quedaré atento a su pronta y oportuna respuesta.",
            style: "justified"
          }),
          new docx.Paragraph({ text: "", style: "normal" }),
          new docx.Paragraph({ text: "", style: "normal" }),
          new docx.Paragraph({ text: "", style: "normal" }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "Atentamente,",
                break: 1
              }),
            ],
            style: "normal"
          }),
          new docx.Paragraph({ text: "", style: "normal" }),
          new docx.Paragraph({ text: "", style: "normal" }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "__________________________",
                break: 1
              }),
              new docx.TextRun({
                text: `\n${content.customerName || "Cliente"}`,
                break: 1
              }),
              new docx.TextRun({
                text: "\nC.C. ",
                break: 1
              }),
              idRun
            ],
            style: "normal"
          })
        ]
      }]
    });

    console.log('Documento DOCX creado en memoria');

    const buffer = await docx.Packer.toBuffer(doc);
    console.log('Documento DOCX convertido a buffer');

    await fs.writeFile(outputPath, buffer);
    console.log(`Documento DOCX generado y guardado en: ${outputPath}`);
  } catch (error) {
    console.error('Error al generar el documento DOCX:', error);
    throw error;
  }
}

module.exports = { generateDocx, sanitizeCustomerData };