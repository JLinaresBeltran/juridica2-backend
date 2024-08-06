const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const execAsync = promisify(exec);

async function generateFiles(content, paths) {
    try {
        console.log('Comenzando la generación de archivos...');

        const outputDir = path.dirname(paths.htmlPath);
        console.log(`Creando directorio de salida: ${outputDir}`);
        await mkdirAsync(outputDir, { recursive: true });

        const cssStyles = `
            body {
                margin: 2cm;
                font-family: Arial, sans-serif;
            }
            .header, .reference, .salutation, .introduction, .content, .closing, .signature {
                margin-bottom: 1cm;
            }
            .header strong, .reference strong, .signature strong {
                display: block;
            }
            .title {
                text-align: center;
                font-weight: bold;
                margin-bottom: 0.5cm;
            }
            ol {
                margin-left: 1.5cm;
            }
        `;

        const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Carta de Reclamación</title>
            <style>${cssStyles}</style>
        </head>
        <body>
            <div class="header">
                <strong>${content.companyName || "Empresa de servicios de telecomunicaciones"}</strong>
                <p>Empresa de servicios de telecomunicaciones</p>
            </div>
            <div class="reference">
                <strong>Referencia: ${content.reference || "Sin referencia"}</strong>
            </div>
            <div class="salutation">
                <p>Respetados Señores:</p>
            </div>
            <div class="introduction">
                <p>${content.customerName || "Cliente"}, identificado con cédula de ciudadanía número ${content.customerId || "Aquí se coloca el No. de identificación"}, en mi calidad de usuario, me dirijo a ustedes para presentar una reclamación en los términos de la Resolución No. 5111 de 2017, "Por la cual se establece el Régimen de Protección de los Derechos de los Usuarios de Servicios de Comunicaciones". Los hechos que motivan mi reclamación son los siguientes:</p>
            </div>
            <div class="content">
                <div class="title">HECHOS</div>
                <ol>
                    ${content.hechos ? content.hechos.map(hecho => `<li>${hecho}</li>`).join('') : '<li>No se proporcionaron hechos.</li>'}
                </ol>
                <div class="title">PETICIÓN</div>
                <p>${content.peticion || "No se proporcionó petición."}</p>
            </div>
            <div class="closing">
                <p>Agradezco su atención y quedaré atento a su pronta y oportuna respuesta.</p>
            </div>
            <div class="signature">
                <strong>Atentamente,</strong>
                <p>${content.customerName || "Cliente"}</p>
                <p>C.C. ${content.customerId || "Aquí se coloca el No. de identificación"}</p>
            </div>
        </body>
        </html>`;

        console.log(`Escribiendo contenido HTML a ${paths.htmlPath}`);
        await writeFileAsync(paths.htmlPath, htmlTemplate);

        console.log(`Ejecutando script Python para convertir HTML a DOCX`);
        const command = `python3 ${path.join(__dirname, '../../utils/generate_docx.py')} ${paths.htmlPath} ${paths.docxPath}`;
        const { stdout, stderr } = await execAsync(command);

        console.log(`Salida del script Python: ${stdout}`);
        if (stderr) {
            console.error(`Error en el script Python: ${stderr}`);
        }

        // Verificar la existencia de los archivos generados
        console.log(`Verificando la existencia del archivo DOCX: ${paths.docxPath}`);
        if (!fs.existsSync(paths.docxPath)) {
            throw new Error(`El archivo DOCX ${paths.docxPath} no fue creado`);
        }

        console.log('Archivos generados correctamente.');
        return { htmlPath: paths.htmlPath, docxPath: paths.docxPath };

    } catch (error) {
        console.error('Error en generateFiles:', error);
        throw error; // Lanzar el error para manejarlo en la llamada a esta función
    }
}

module.exports = {
    generateFiles
};