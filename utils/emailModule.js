// emailModule.js

require('dotenv').config();
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Determinar la ruta base del proyecto
const projectRoot = path.resolve(__dirname, '..');

// Definir la ruta del directorio de imágenes
const imageDir = path.join(projectRoot, 'utils', 'images');

// Configuración de la URL del servidor
const BASE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:5000';
const SERVER_URL = BASE_URL;

class EmailModule {
    constructor() {
        this.transporter = this.createTransporter();
    }

    createTransporter() {
        const transporterConfig = {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === 'true'
            }
        };

        console.log('Transporter Config:', {
            ...transporterConfig,
            auth: {
                user: transporterConfig.auth.user,
                pass: transporterConfig.auth.pass ? '******' : 'not set'
            }
        });

        return nodemailer.createTransport(transporterConfig);
    }

    async verifyTransporter() {
        try {
            await this.transporter.verify();
            console.log('SMTP connection verified successfully');
        } catch (error) {
            console.error('SMTP verification failed:', error);
            throw error;
        }
    }

    getEmailGenerator(serviceType) {
        console.log(`[getEmailGenerator] Tipo de servicio recibido: ${serviceType}`);
        let emailGenerator;
        switch (serviceType) {
            case 'telefonia':
                emailGenerator = require('../controllers/telefonia/emailContent');
                break;
            case 'servicios_publicos':
                emailGenerator = require('../controllers/servicios_publicos/emailContent');
                break;
            default:
                throw new Error(`Tipo de servicio desconocido o indefinido: ${serviceType}`);
        }
        console.log('[getEmailGenerator] Contenido del emailGenerator:', emailGenerator);
        return emailGenerator;
    }

    async emailModule(lead, outputDir, serviceType) {
        console.log('[emailModule] Iniciando el envío de correo.');
        console.log('[emailModule] Lead:', lead);
        console.log('[emailModule] OutputDir:', outputDir);
        console.log('[emailModule] ServiceType:', serviceType);
        console.log('[emailModule] SERVER_URL:', SERVER_URL);
        console.log('Directorio de imágenes:', imageDir);

        if (!serviceType) {
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

            const emailGenerator = this.getEmailGenerator(serviceType);
        const { subject, html } = emailGenerator.generateEmailContent(lead, SERVER_URL);

        const imageDir = path.join(projectRoot, 'utils', 'images');
        console.log('Directorio de imágenes:', imageDir);

        let imageFiles = [];
        if (process.env.NODE_ENV !== 'production') {
            try {
                imageFiles = await fs.readdir(imageDir);
                console.log('Archivos de imágenes encontrados:', imageFiles);
            } catch (error) {
                console.error('Error al leer el directorio de imágenes:', error);
            }
        }

        const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
        const imageAttachments = isProduction ? [] : imageFiles
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return allowedExtensions.includes(ext) && file !== '.DS_Store';
            })
            .map(file => ({
                filename: file,
                path: path.join(imageDir, file),
                cid: file  // Usar el nombre completo del archivo como CID
            }));

            await this.verifyTransporter();

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: lead.email,
                subject,
                html,
                attachments: [...attachments, ...imageAttachments]
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('[emailModule] Correo enviado exitosamente:', info.response);
            return info;
        } catch (error) {
            console.error('[emailModule] Error:', error.message);
            console.error('[emailModule] Stack trace:', error.stack);
            throw error;
        }
    }
}

module.exports = new EmailModule();