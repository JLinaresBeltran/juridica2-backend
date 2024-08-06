const path = require('path');

function generateEmailHTML(lead) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Previsualización del Correo Electrónico</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap">
        <style>
            @font-face {
                font-family: 'Nasalization';
                src: url('/fonts/nasalization-free.rg-regular.otf') format('opentype');
                font-weight: normal;
                font-style: normal;
            }
            body {
                font-family: 'Roboto', Helvetica, Arial, sans-serif;
                background-color: #f0f8ff;
                margin: 0;
                padding: 0;
                line-height: 1.6;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: auto;
                background-color: rgba(63, 243, 242, 0.16);
                padding: 20px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                background-color: #1e89a7;
                padding: 0;
                border-radius: 5px;
            }
            .header-img {
                width: 100%;
                height: auto;
            }
            .header-text {
                font-size: 18px;
                font-weight: bold;
                color: white;
                background-color: #022440;
                padding: 10px 0;
            }
            .content {
                margin-top: 20px;
            }
            .centered-image {
                text-align: center;
                margin: 20px 0;
            }
            .centered-image img {
                max-width: 100%;
                height: auto;
            }
            h1, h2 {
                font-family: 'Nasalization', Helvetica, Arial, sans-serif;
                color: #04315a;
            }
            .content p {
                margin: 10px 0;
                color: #022440;
            }
            .content ul {
                list-style: none;
                padding: 0;
            }
            .content li {
                margin-bottom: 10px;
                padding-left: 15px;
                position: relative;
            }
            .content li::before {
                content: '•';
                color: #04315a;
                position: absolute;
                left: 0;
            }
            .register-button {
                display: block;
                width: 100%;
                padding: 10px;
                margin: 20px 0;
                background-color: #1e89a7;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
            }
            .register-button:hover {
                background-color: #04315a;
            }
            .legal-orientation, .claims {
                text-align: center;
                margin-top: 20px;
            }
            .legal-orientation h2, .claims h2 {
                color: #04315a;
            }
            .icons {
                display: flex;
                justify-content: center;
                gap: 10px;
            }
            .icon-item {
                text-align: center;
            }
            .icon-item p {
                margin-top: 5px;
                font-size: 14px;
                color: #022440;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
            }
            .footer img {
                width: 100px;
                margin: 10px;
            }
            .footer p {
                margin: 5px 0;
                color: #022440;
            }
            .footer a {
                color: #04315a;
                text-decoration: none;
            }
            .footer a:hover {
                text-decoration: underline;
            }
            @media (max-width: 600px) {
                .container {
                    padding: 10px;
                }
                .header-text {
                    font-size: 16px;
                }
                .register-button {
                    font-size: 14px;
                }
                .footer img {
                    width: 80px;
                }
                .icon-item p {
                    font-size: 12px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:imagen-superior@juli" class="header-img">
            </div>
            <div class="header-text">¡JULI, tu voz legal!</div>
            <div class="content">
                <div class="centered-image">
                    <img src="cid:logo@juli" alt="Logo Jurídica">
                </div>
                <p>Hola ${lead.name},</p>
                <p>Siga los siguientes pasos para que su reclamación DE SERVICIOS PÚBLICOS sea procesada de manera efectiva.</p>
                <ul>
                    <li><strong>Presentación del Documento en Físico:</strong> Es recomendable presentar el documento en formato físico, así, que constituye una reclamación formal jurídicamente válida.</li>
                    <li><strong>Asistencia Legal con JULI:</strong> JULI es un asistente legal, impulsado por AI estará a su disposición para brindar orientación durante todo el proceso.</li>
                    <li><strong>Radicación de la Reclamación:</strong> El personal encargado de atender su reclamación tiene la obligación de radicarla. Exija el radicado.</li>
                    <li><strong>Plazo de Resolución:</strong> Su reclamación debe ser resuelta en un plazo máximo de 15 días hábiles.</li>
                    <li><strong>Recurso de Revisión:</strong> Si no está conforme con la respuesta, puede interponer un recurso. Tiene un término de 5 días para hacerlo. Instrúyase, y JULI se encargará de analizar, procesar y realizar el recurso en caso de ser necesario, un abogado se encargará de super.</li>
                </ul>
                <button class="register-button">Regístrese</button>
            </div>
            <div class="legal-orientation">
                <h2>Orientación legal para</h2>
                <div class="icons">
                    <div class="icon-item">
                        <img src="cid:trabajo@juli">
                        <p>Trabajo</p>
                    </div>
                    <div class="icon-item">
                        <img src="cid:negocio@juli" alt="Negocios">
                        <p>Negocios</p>
                    </div>
                    <div class="icon-item">
                        <img src="cid:familia@juli" alt="Familia">
                        <p>Familia</p>
                    </div>
                    <div class="icon-item">
                        <img src="cid:comercio@juli" alt="Comercio">
                        <p>Comercio</p>
                    </div>
                    <div class="icon-item">
                        <img src="cid:quiebra@juli" alt="Quiebra">
                        <p>Quiebra</p>
                    </div>
                </div>
            </div>
            <div class="claims">
                <h2>Reclamaciones de</h2>
                <div class="icons">
                    <div class="icon-item">
                        <img src="cid:tiquetes@juli" alt="Tiquetes">
                        <p>Tiquetes</p>
                    </div>
                    <div class="icon-item">
                        <img src="cid:publico@juli" alt="Servicios Públicos">
                        <p>Servicios Públicos</p>
                    </div>
                    <div class="icon-item">
                        <img src="cid:salud@juli" alt="Salud">
                        <p>Salud</p>
                    </div>
                    <div class="icon-item">
                        <img src="cid:defectuoso@juli" alt="Producto defectuoso">
                        <p>Producto defectuoso</p>
                    </div>
                    <div class="icon-item">
                        <img src="cid:multa@juli" alt="Foto Multa">
                        <p>Foto Multa</p>
                    </div>
                </div>
            </div>
            <div class="footer">
                <img src="cid:logo@juli" alt="Logo Jurídica">
                <p>Disfruta de una mejor experiencia desde nuestra app</p>
                <div class="app-links">
                    <img src="cid:google@juli" alt="Google Play">
                    <img src="cid:app@juli" alt="App Store">
                </div>
                <p>
                    <a href="#">Aviso Legal</a> | 
                    <a href="#">Política de Privacidad</a> | 
                    <a href="#">Contactar</a> | 
                    <a href="#">Cancelar la suscripción</a>
                </p>
                <p>Este correo ha sido enviado para ${lead.email}</p>
                <p>Los archivos adjuntos son únicos y exclusivos del destinatario</p>
            </div>
        </div>
    </body>
    </html>`;
}

function getAttachments() {
    const imageDir = path.join(__dirname, '../utils/images');
    try {
        const attachments = [
            //{ filename: 'documento.pdf', path: path.join(__dirname, '../utils/output/output.pdf') },
            { filename: 'documento.docx', path: path.join(__dirname, '../utils/output/output.docx') },
            { filename: 'logo.png', path: path.join(imageDir, 'logo1.png'), cid: 'logo@juli' },
            { filename: 'imagen-superior.png', path: path.join(imageDir, 'imagen-superior.png'), cid: 'imagen-superior@juli' },
            { filename: 'trabajo.png', path: path.join(imageDir, 'trabajo.png'), cid: 'trabajo@juli' },
            { filename: 'negocio.png', path: path.join(imageDir, 'negocio.png'), cid: 'negocio@juli' },
            { filename: 'familia.png', path: path.join(imageDir, 'familia.png'), cid: 'familia@juli' },
            { filename: 'comercio.png', path: path.join(imageDir, 'comercio.png'), cid: 'comercio@juli' },
            { filename: 'quiebra.png', path: path.join(imageDir, 'quiebra.png'), cid: 'quiebra@juli' },
            { filename: 'tiquetes.png', path: path.join(imageDir, 'tiquetes.png'), cid: 'tiquetes@juli' },
            { filename: 'publico.png', path: path.join(imageDir, 'publico.png'), cid: 'publico@juli' },
            { filename: 'salud.png', path: path.join(imageDir, 'salud.png'), cid: 'salud@juli' },
            { filename: 'defectuoso.png', path: path.join(imageDir, 'defectuoso.png'), cid: 'defectuoso@juli' },
            { filename: 'multa.png', path: path.join(imageDir, 'multa.png'), cid: 'multa@juli' },
            { filename: 'google.png', path: path.join(imageDir, 'google.png'), cid: 'google@juli' },
            { filename: 'app.png', path: path.join(imageDir, 'app.png'), cid: 'app@juli' }
        ];
        return attachments;
    } catch (error) {
        console.error('Error al obtener los adjuntos:', error);
        throw error;
    }
}

module.exports = {
    generateEmailHTML,
    getAttachments
};
