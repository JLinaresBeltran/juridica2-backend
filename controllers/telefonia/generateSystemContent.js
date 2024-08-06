const fs = require('fs');
const path = require('path');

function generateSystemContentTelefonia(lead) {
    console.log('generateSystemContent: Generando contenido del sistema para telefonía...');
    
    // Imprimir el objeto lead para ver qué datos se están recibiendo
    console.log('Datos del lead:', lead);
    const customerName = lead.name || '[nombres y apellidos]';
    const customerId = lead.documentNumber || '[aquí debe colocar su número de cédula]';
    const customerAddress = lead.address || '[Aquí debe colocar su dirección física]';
    const customerEmail = lead.email || '[correo electrónico]';
    const customerPhone = lead.phone || '[número celular]';
    const companyName = lead.company || '[NOMBRE DE LA EMPRESA]';
  

    const systemContent = 
    "Actúa como un Abogado experto en reclamación de servicios de telefonía, televisión e internet fijo y móvil. Genera un documento de reclamación en HTML basado en una conversación entre USER y JULI. Sigue estas pautas:\n\n" +
    "1. Analiza la conversación y extrae todos los datos relevantes.\n" +
    "2. Redacta en primera persona, generando unos hechos numerados, claros y detallados que expliquen la situación. Incluye tantos hechos como sean necesarios para cubrir completamente la situación descrita.\n" +
    "3. Formula una petición clara, contundente y cordial basada en los hechos.\n\n" +
    "Posibles peticiones incluyen:\n" +
    "- Ajuste de factura\n" +
    "- Devolución de dinero\n" +
    "- Cumplimiento de garantía\n" +
    "- Reparación o cambio del bien\n" +
    "- Declaración de vulneración de derechos\n" +
    "- Reparación por publicidad engañosa\n\n" +
    "Mantén intactos los campos: customerName, customerId, customerAddress, customerEmail y customerPhone.\n\n" +
    "Estructura del documento:\n" +
    "<div class='header'>" +
    "  <strong>Señores</strong><br />" +
    "  <strong>" + companyName + "</strong><br />" +
    "  <strong>Empresa de telefonía móvil</strong><br /><br />" +
    "</div>" +
    "<div class='reference'>" +
    "  <strong>Referencia:</strong> <!-- Inserta aquí una referencia corta y contundente -->" +
    "</div>" +
    "<div class='salutation'>" +
    "  <p>Respetados Señores:</p>" +
    "</div>" +
    "<div class='introduction'>" +
    "  <p class='justify-content'><strong>" + customerName + "</strong>, mayor de edad, identificado con cédula " + customerId + ", presento la siguiente reclamación:</p>" +
    "</div>" +
    "<div class='title'>HECHOS:</div>" +
    "<ol>" +
    "  <!-- Inserta aquí todos los hechos necesarios, numerados y en formato HTML -->" +
    "</ol>" +
    "<div class='title'>PETICIÓN:</div>" +
    "<div class='content'>" +
    "  <!-- Inserta aquí la petición detallada -->" +
    "</div>" +
    "<div class='title'>NOTIFICACIONES:</div>" +
    "<div class='content'>" +
    "  Dirección: " + customerAddress + "<br />" +
    "  Email: " + customerEmail +
    "</div>" +
    "<div class='closing'>" +
    "  <p>Agradezco su atención y pronta respuesta.</p>" +
    "</div>" +
    "<div class='signature'>" +
    "  <strong>" + customerName + "</strong><br />" +
    "  <strong>C.C. No. " + customerId + "</strong><br />" +
    "  " + customerPhone +
    "</div>";

    console.log('generateSystemContent: Contenido del sistema generado exitosamente.');

    // Imprimir el contenido generado para verificar
    console.log('Contenido generado:', systemContent);

    return systemContent;
}

module.exports = {
    generateSystemContent: generateSystemContentTelefonia
};
