require('dotenv').config();
const nodemailer = require('nodemailer');

const createTransporter = () => {
    console.log('Creando transporter con la siguiente configuración:');
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

    const transporter = nodemailer.createTransport(transporterConfig);

    return transporter;
};

const verifyTransporter = async (transporter) => {
    try {
        await transporter.verify();
        console.log('SMTP connection verified successfully');
    } catch (error) {
        console.error('SMTP verification failed:', error);
        throw error;
    }
};

const sendEmailWithAttachments = async (to, subject, html, attachments) => {
    const transporter = createTransporter();
    
    await verifyTransporter(transporter);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
        attachments
    };

    try {
        console.log('Intentando enviar correo a:', to);
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado exitosamente:', info.response);
        return info;
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        throw error;
    }
};

module.exports = {
    createTransporter,
    verifyTransporter,
    sendEmailWithAttachments
};