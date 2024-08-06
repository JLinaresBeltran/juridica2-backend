const fs = require('fs').promises;
const path = require('path');
const { sendEmailWithAttachments } = require('../../utils/emailTransporter');

function getEmailGenerator(serviceType) {
    console.log(`[getEmailGenerator] Tipo de servicio recibido: ${serviceType}`);
    let emailGenerator;
    switch (serviceType) {
        case 'telefonia':
            emailGenerator = require('../telefonia/emailContent');
            break;
        case 'servicios_publicos':
            emailGenerator = require('../servicios_publicos/emailContent');
            break;
        default:
            console.error(`[getEmailGenerator] Tipo de servicio desconocido o indefinido: ${serviceType}`);
            throw new Error('Tipo de servicio desconocido o indefinido');
    }
    console.log('[getEmailGenerator] Contenido del emailGenerator:', emailGenerator);
    return emailGenerator;
}

async function sendEmailWithFiles(lead, outputDir, serviceType) {
    console.log('[sendEmailWithFiles] Iniciando el envío de correo.');
    console.log('[sendEmailWithFiles] Lead:', lead);
    console.log('[sendEmailWithFiles] OutputDir:', outputDir);
    console.log('[sendEmailWithFiles] ServiceType:', serviceType);

    if (!serviceType) {
        console.error('[sendEmailWithFiles] ServiceType no proporcionado');
        throw new Error('ServiceType es requerido para enviar el email');
    }

    try {
        const files = await fs.readdir(outputDir);
        const attachments = await Promise.all(files.map(async (file) => {
            const filePath = path.join(outputDir, file);
            const content = await fs.readFile(filePath);
            return {
                filename: file,
                content: content
            };
        }));

        const emailGenerator = getEmailGenerator(serviceType);
        console.log('[sendEmailWithFiles] EmailGenerator:', emailGenerator);
        
        if (typeof emailGenerator.generateEmailContent !== 'function') {
            console.error('[sendEmailWithFiles] generateEmailContent no es una función');
            throw new Error('generateEmailContent no es una función');
        }

        const { subject, html } = emailGenerator.generateEmailContent(lead);

        await sendEmailWithAttachments(lead.email, subject, html, attachments);
        console.log('[sendEmailWithFiles] Correo enviado exitosamente');
    } catch (error) {
        console.error('[sendEmailWithFiles] Error enviando el correo:', error);
        throw error;
    }
}

module.exports = {
    sendEmailWithFiles
};