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

// Definir isProduction
const isProduction = process.env.NODE_ENV === 'production';

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
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('isProduction:', isProduction);

        if (!serviceType) {
            throw new Error('ServiceType es requerido para enviar el email');
        }

        try {
            const files = await fs.readdir(outputDir);
            console.log('[emailModule] Archivos encontrados en outputDir:', files);

            const attachments = await Promise.all(files.map(async (file) => {
                const filePath = path.join(outputDir, file);
                const content = await fs.readFile(filePath);
                return {
                    filename: file,
                    content: content
                };
            }));

            console.log('[emailModule] Attachments preparados:', attachments.map(a => a.filename));

            const emailGenerator = this.getEmailGenerator(serviceType);
            const { subject, html } = emailGenerator.generateEmailContent(lead, SERVER_URL, isProduction);

            console.log('[emailModule] Asunto del correo:', subject);
            console.log('[emailModule] Contenido HTML del correo (primeros 500 caracteres):', html.substring(0, 500));

            let imageFiles = [];
            try {
                imageFiles = await fs.readdir(imageDir);
                console.log('Archivos de imágenes encontrados:', imageFiles);
            } catch (error) {
                console.error('Error al leer el directorio de imágenes:', error);
            }

            const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
            const imageAttachments = imageFiles
                .filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return allowedExtensions.includes(ext) && file !== '.DS_Store';
                })
                .map(file => ({
                    filename: file,
                    path: path.join(imageDir, file),
                    cid: file  // Usar el nombre completo del archivo como CID
                }));

            console.log('[emailModule] Image attachments:', imageAttachments);

            await this.verifyTransporter();

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: lead.email,
                subject,
                html,
                attachments: [...attachments, ...imageAttachments]
            };

            console.log('[emailModule] Opciones de correo preparadas:', {
                ...mailOptions,
                html: mailOptions.html.substring(0, 100) + '...',  // Mostrar solo los primeros 100 caracteres del HTML
                attachments: mailOptions.attachments.map(a => a.filename || a.cid)
            });

            const info = await this.transporter.sendMail(mailOptions);
            console.log('[emailModule] Correo enviado exitosamente:', info.response);
            return info;
        } catch (error) {
            console.error('[emailModule] Error:', error.message);
            console.error('[emailModule] Stack trace:', error.stack);
            throw error;
        }
    }

    async sendPasswordResetEmail(lead, token) {
        console.log('[sendPasswordResetEmail] Iniciando el envío de correo de restablecimiento de contraseña.');
        
        try {
          const resetUrl = `${SERVER_URL}/reset-password/${token}`;
          
          const subject = "Restablecimiento de contraseña - Juridica2";
          const html = `
            <h1>Restablecimiento de contraseña</h1>
            <p>Hola ${lead.name},</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
            <a href="${resetUrl}">Restablecer contraseña</a>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste este restablecimiento, puedes ignorar este correo.</p>
            <p>Saludos,<br>El equipo de Juridica2</p>
          `;
    
          await this.verifyTransporter();
    
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: lead.email,
            subject,
            html
          };
    
          const info = await this.transporter.sendMail(mailOptions);
          console.log('[sendPasswordResetEmail] Correo de restablecimiento enviado exitosamente:', info.response);
          return info;
        } catch (error) {
          console.error('[sendPasswordResetEmail] Error:', error.message);
          console.error('[sendPasswordResetEmail] Stack trace:', error.stack);
          throw error;
        }
      }
    }

module.exports = new EmailModule();