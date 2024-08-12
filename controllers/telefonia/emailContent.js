const path = require('path');


function generateEmailHTML(lead, serverUrl) {
    const isProduction = process.env.NODE_ENV === 'production';

    function getImageSrc(imageName) {
        return isProduction ? `${serverUrl}/${imageName}` : `cid:${imageName}`;
    }

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Previsualización del Correo Electrónico</title>
    <!-- Enlace a Bootstrap para estilos CSS -->
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <style>
        /* Definición de fuentes personalizadas */
        @font-face {
            font-family: 'Nasalization';
            src: url('${serverUrl}/fonts/nasalization-free.rg-regular.otf') format('opentype');
            font-weight: normal;
            font-style: normal;
        }
        @font-face {
            font-family: 'HelveticaNeue';
            src: url('${serverUrl}/fonts/HelveticaNeue Regular.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
        }
        @font-face {
            font-family: 'HelveticaNeueBold';
            src: url('${serverUrl}/fonts/HelveticaNeue Bold.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
        }
        /* Estilos generales del cuerpo del correo */
        body {
            font-family: 'HelveticaNeue', Arial, sans-serif;
            background-color: #f0f8ff;
            margin: 0;
            padding: 0;
            line-height: 1.6;
            -webkit-text-size-adjust: 100%;
            overflow-x: hidden;
        }
        .bold-text {
            font-family: 'HelveticaNeueBold', Arial, sans-serif;
        }
        /* Estilos del contenedor principal */
        .container-custom {
            width: 100%;
            max-width: 600px;
            margin: auto;
            background-color: rgba(63, 243, 242, 0.16);
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            box-sizing: border-box;
        }
        /* Estilos de la cabecera */
        .header {
            text-align: center;
            background-color: #f0f8ff;
            padding: 0;
            border-radius: 5px;
            overflow: hidden;
            position: relative;
            top: -20px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        }
        .header-img {
            width: 100%;
            height: auto;
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;
        }
        .header-text {
            font-size: 18px;
            font-weight: bold;
            color: white;
            background-color: #022440;
            padding: 10px 0;
            text-align: center;
            font-family: 'Nasalization', Arial, sans-serif;
        }
        /* Estilos del contenido */
        .content {
            margin-top: 20px;
            box-sizing: border-box;
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
            font-family: 'Nasalization', Arial, sans-serif;
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
        /* Estilo unificado para ambos botones */
        .custom-button {
            display: block;
            width: 100%;
            padding: 10px;
            margin: 20px 0 10px;
            background-color: #1e89a7;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            box-sizing: border-box;
            font-family: 'Nasalization', Arial, sans-serif;
            text-decoration: none;
            text-align: center;
        }
        .custom-button:hover {
            background-color: #04315a;
            color: white;
            text-decoration: none;
            background-color: #04315a !important;
        }
        .juli-info {
            text-align: center;
            color: #022440;
            margin-bottom: 20px;
        }
        /* Estilos del contenedor de la imagen */
        .image-container {
            text-align: center;
            margin-top: 20px;
            box-sizing: border-box;
        }
        .image-container img {
            width: 100%;
            height: auto;
            max-width: 600px;
        }
        /* Estilos del pie de página */
        .footer {
            text-align: center;
            margin-top: 20px;
            box-sizing: border-box;
        }
        .footer .logo {
            width: 300px;
            margin: 5px;
            max-width: 100%;
        }
        .footer img {
            width: 100px;
            margin: 10px;
            max-width: 100%;
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
        /* Estilos responsivos */
        @media (max-width: 600px) {
            .header-text {
                font-size: 16px;
            }
            .custom-button {
                font-size: 14px;
            }
            .footer .logo {
                width: 250px;
            }
            .footer img {
                width: 80px;
            }
        }
    </style>
</head>
<body>
    <div class="container mt-4">
        <div class="card container-custom">
            <!-- Imagen de la cabecera -->
            <div class="header card-img-top position-relative">
                <img src="${serverUrl}/images/imagen-superior.png" class="header-img">
            </div>
            <!-- Texto de la cabecera -->
            <div class="header-text">Transforma tu Experiencia Legal</div>
            <!-- Contenido principal -->
            <div class="content card-body">
                <p class="bold-text">Hola ${lead.name},</p>
                <p>Siga los siguientes pasos para que su reclamación sea procesada de manera efectiva.</p>
                <ul>
                    <li><strong class="bold-text">Presentación del Documento:</strong> Se recomienda presentar el documento en formato físico para evitar posibles complicaciones con los portales virtuales.</li>
                
                    <li><strong class="bold-text">Asistencia Legal con JULI:</strong> JULI, es un asistente legal impulsado por IA, está disponible 24/7 para brindarte orientación durante todo el proceso.</li>
                
                    <li><strong class="bold-text">Radicación de la Reclamación:</strong> El personal encargado tiene la obligación de radicar su reclamación. Asegúrese de solicitar y recibir el número de radicado.</li>
                
                    <li><strong class="bold-text">Plazo de Resolución:</strong> Su reclamación debe ser resuelta en un plazo máximo de 15 días hábiles a partir de la fecha de radicación.</li>
                
                    <li><strong class="bold-text">Seguimiento:</strong> Se han programado dos recordatorios automáticos: el primero a los 10 días hábiles y el segundo a los 15 días hábiles después de la radicación. Estos le recordará sobre su solicitud.</li>
                
                    <li><strong class="bold-text">Recursos:</strong> Si no está conforme con la respuesta, tiene 5 días hábiles para interponer un recurso. Regístrese y JULI le ayudará a analizar, procesar y presentar el recurso si es necesario.</li>
                
                    <li><strong class="bold-text">Asistencia Adicional:</strong> Para cualquier duda o información adicional sobre este proceso, puede llamar a JULI en cualquier momento. El le brindara orientación.</li>
                </ul>
                <!-- Botón de registro -->
                <a href="https://www.juridicaenlinea.co" class="custom-button" target="_blank" style="display: block; width: 100%; padding: 10px; margin: 20px 0 10px; background-color: #1e89a7; color: #ffffff !important; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; box-sizing: border-box; font-family: 'Nasalization', Arial, sans-serif; text-decoration: none; text-align: center;">
                <span style="color: #ffffff !important;">Regístrese</span>
                </a>
  
                <!-- Botón de JULI actualizado -->
                <a href="https://www.juridicaenlinea.co" class="custom-button" target="_blank" style="display: block; width: 100%; padding: 10px; margin: 20px 0 10px; background-color: #1e89a7; color: #ffffff !important; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; box-sizing: border-box; font-family: 'Nasalization', Arial, sans-serif; text-decoration: none; text-align: center;">
                <span style="color: #ffffff !important;">Llamar a JULI</span>
                </a>
  
  <!-- El párrafo "Si requieres información adicional comunícate con JULI" ha sido eliminado -->
            </div>
        </div>
        <!-- Contenedor de la imagen de servicios -->
        <div class="image-container text-center mt-4">
            <img src="${serverUrl}/images/servicios.png" alt="Servicios" class="img-fluid">
        </div>
        <!-- Pie de página -->
        <div class="footer text-center mt-4">
            <img src="${serverUrl}/images/logo1.png" class="logo img-fluid mb-3" alt="Logo Jurídica">
            <p>Disfruta de una mejor experiencia desde nuestra app</p>
            <div class="app-links d-flex justify-content-center mb-3">
                <img src="${serverUrl}/images/google.png" alt="Google Play" class="img-fluid mr-2">
                <img src="${serverUrl}/images/app.png" alt="App Store" class="img-fluid">
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

    <!-- Inclusión de scripts de Bootstrap y jQuery -->
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.4/dist/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
</body>
</html>`;
}

function getAttachments(outputDir) {
    return [
        { filename: 'documento.docx', path: path.join(outputDir, 'output.docx') }
    ];
}

function generateEmailContent(lead, serverUrl) {
    return {
        subject: `Reclamación para ${lead.name}`,
        text: `Estimado/a ${lead.name},\n\nAdjunto encontrará su documento de reclamación...`,
        html: generateEmailHTML(lead, serverUrl)
    };
}

module.exports = {
    generateEmailContent,
    getAttachments
};