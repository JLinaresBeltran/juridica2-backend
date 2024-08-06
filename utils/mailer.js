const { sendEmailWithAttachments } = require('./emailTransporter');

const sendEmail = async (to, subject, text, attachments) => {
  try {
    console.log('Iniciando envío de correo desde mailer.js');
    const result = await sendEmailWithAttachments(to, subject, text, attachments);
    console.log('Correo enviado exitosamente desde mailer.js');
    return result;
  } catch (error) {
    console.error('Error al enviar correo desde mailer.js:', error);
    throw error;
  }
};

module.exports = sendEmail;