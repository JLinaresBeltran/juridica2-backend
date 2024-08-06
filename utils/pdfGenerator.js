// const chromium = require('chrome-aws-lambda');
// const puppeteer = require('puppeteer-core');

// async function convertHTMLToPDF(htmlContent, outputPath) {
//     try {
//         console.log('pdfGenerator: Iniciando la generación del PDF...');
//         const browser = await puppeteer.launch({
//             args: chromium.args,
//             defaultViewport: chromium.defaultViewport,
//             executablePath: await chromium.executablePath || '/app/.apt/usr/bin/google-chrome-stable',
//             headless: chromium.headless,
//             ignoreHTTPSErrors: true
//         });
//         console.log('pdfGenerator: Navegador lanzado.');
//         const page = await browser.newPage();
//         console.log('pdfGenerator: Nueva página creada en el navegador.');

//         const htmlTemplate = `
//         <html>
//         <head>
//             <style>
//                 body {
//                     font-family: Arial, sans-serif;
//                     margin: 1cm;
//                 }
//                 h1, h2, h3 {
//                     text-align: center;
//                 }
//                 p {
//                     text-align: justify;
//                     margin-bottom: 1em;
//                 }
//                 .title {
//                     text-align: center;
//                     font-weight: bold;
//                     margin-top: 1em;
//                     margin-bottom: 0.5em;
//                 }
//                 .content {
//                     margin-bottom: 1em;
//                     text-align: justify;
//                 }
//                 .justify-content {
//                     text-align: justify;
//                 }
//             </style>
//         </head>
//         <body>
//             ${htmlContent}
//         </body>
//         </html>
//         `;

//         console.log('pdfGenerator: Configurando el contenido para la generación del PDF...');
//         await page.setContent(htmlTemplate, { waitUntil: 'load' });
//         console.log('pdfGenerator: Contenido establecido en la página.');
//         await page.pdf({
//             path: outputPath,
//             format: 'A4',
//             margin: {
//                 top: '2cm',
//                 right: '2cm',
//                 bottom: '2cm',
//                 left: '2cm'
//             }
//         });

//         console.log('pdfGenerator: PDF generado en la ruta:', outputPath);
//         await browser.close();
//         console.log('pdfGenerator: Navegador cerrado.');
//     } catch (error) {
//         console.error('pdfGenerator: Error al generar el PDF:', error);
//         throw new Error('pdfGenerator: Error al generar el PDF: ' + error.message);
//     }
// }

// module.exports = {
//     convertHTMLToPDF
// };

//console.log('pdfGenerator: Función convertHTMLToPDF exportada');
