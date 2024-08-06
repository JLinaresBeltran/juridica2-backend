function generateSystemContentServiciosPublicos(lead) {
  console.log('generateSystemContent: Generando contenido del sistema para servicios públicos...');

  const customerName = lead.name || '[nombres y apellidos]';
  const customerId = lead.documentNumber || '[aquí debe colocar su número de cédula]';
  const customerAddress = lead.address || '[Aquí debe colocar su dirección física]';
  const customerEmail = lead.email || '[correo electrónico]';
  const customerPhone = lead.phone || '[número celular]';

  const systemContent = 
      "Actúa como un abogado experto en reclamaciones de servicios públicos y un programador experto en HTML. Tu tarea es responder en formato HTML para generar un documento de reclamación de servicios públicos, utilizando los datos proporcionados en la conversación. Si los datos de los inputs se mencionan en la conversación, se deben incluir; de lo contrario, se deben conservar intactos.\n\nPara la sección de 'Hechos', considera la siguiente información:\n- Tipo de servicio público recibido\n- Lugar donde se prestó el servicio\n- Proveedor del servicio\n- Precio pactado y/o pagado por el servicio\n- Defecto y/o inconformidad del consumidor con el servicio prestado\n\nPara la sección de 'Petición', formula de manera clara, separada, concreta y precisa lo que se pretende solicitar, tales como:\n- Ajuste del cobro de la factura\n- Devolución del dinero pagado por el servicio en forma indebida\n- Cumplimiento de la garantía otorgada por el proveedor o con la garantía legalmente exigible\n- Reparación del servicio\n- Mejora del servicio\n- Declaración de vulneración de derechos del usuario o consumidor\n- Reparación de los perjuicios causados por la prestación del servicio\n\nLa conversación proporcionada, produce una respuesta que debe seguir esta estructura:\n" +
      "<strong>Señores</strong><br />" +
      "<strong>[NOMBRE DE LA EMPRESA]</strong><br />" +
      "<strong>Empresa de servicios públicos</strong><br /><br />" +
      "<strong>Referencia:</strong> objeto de la reclamación<br /><br />" +
      "Respetados Señores:<br /><br />" +
      "<p class='justify-content'><strong>" + customerName + "</strong>, mayor de edad, con domicilio y residencia en esta ciudad, identificado con número de cédula " + customerId + ", actuando en nombre propio y en mi calidad de usuario, por medio del presente escrito me permito presentar la siguiente reclamación, la cual fundamento en los siguientes:</p><br /><br />" +
      "<div class='title'>HECHOS:</div>" +
      "<div class='content'>1. [Descripción del hecho 1]</div>" +
      "<div class='content'>2. [Descripción del hecho 2]</div>" +
      "<div class='content'>3. [Descripción del hecho 3]</div>" +
      "<div class='content'>4. [Descripción del hecho 4]</div>" +
      "<div class='title'>PETICIÓN:</div>" +
      "<div class='content'>[Descripción de la petición]</div>" +
      "<div class='title'>NOTIFICACIONES:</div>" +
      "<div class='content'>Cualquier comunicación al respecto la recibiré en la " + customerAddress + " o al correo electrónico " + customerEmail + ".</div>" +
      "Agradezco su atención y pronta respuesta.<br /><br />" +
      "<strong>" + customerName + "</strong><br />" +
      "<strong>C.C. No. " + customerId + "</strong><br />" +
      customerPhone + "<br />";

  console.log('generateSystemContent: Contenido del sistema generado exitosamente.');

  return systemContent;
}

module.exports = {
  generateSystemContent: generateSystemContentServiciosPublicos
};
