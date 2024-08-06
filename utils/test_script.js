const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');

const commonMiddlewaresPath = path.join(__dirname, 'middlewares', 'commonMiddlewares.js');
console.log("Ruta absoluta de commonMiddlewares.js:", commonMiddlewaresPath);

fs.access(commonMiddlewaresPath, fs.constants.F_OK, (err) => {
    if (err) {
        console.error(`El archivo commonMiddlewares.js no existe en la ruta: ${commonMiddlewaresPath}`);
    } else {
        console.log(`El archivo commonMiddlewares.js existe en la ruta: ${commonMiddlewaresPath}`);
    }
});

const { logRouteMiddleware, errorHandler, notFoundHandler } = require('./middlewares/commonMiddlewares');
const telefoniaRoutes = require('./routes/telefoniaRoutes');
const serviciosPublicosRoutes = require('./routes/serviciosPublicosRoutes');

const app = express();

console.log("Configurando variables de entorno");
console.log("Variables de Entorno:");
console.log("PORT:", process.env.PORT);

app.use(express.json({ limit: '50mb' }));
app.use((req, res, next) => {
    console.log("Cuerpo de solicitud recibido:", req.body);
    next();
});

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
    console.log("CORS configurado con:", corsOptions);
    next();
});

// Middleware para servir archivos estáticos desde el directorio 'backend/landing/imagenespng/favicon'
const faviconPath = path.join(__dirname, 'landing/imagenespng/favicon');
console.log("Ruta absoluta de favicon:", faviconPath);
app.use('/favicon', express.static(faviconPath));

// Middleware para servir archivos estáticos desde el directorio 'backend/landing'
const landingPath = path.join(__dirname, 'landing');
console.log("Ruta absoluta de landing:", landingPath);
app.use(express.static(landingPath));

// Servir index.html desde la ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(landingPath, 'index.html'));
});

// Middleware para servir archivos estáticos desde el directorio 'backend/utils/images'
const imagesPath = path.join(__dirname, 'utils/images');
console.log("Ruta absoluta de images:", imagesPath);
app.use('/images', express.static(imagesPath));

// Rutas de la aplicación
app.use('/telefonia', logRouteMiddleware('/telefonia'), telefoniaRoutes);
app.use('/servicios-publicos', logRouteMiddleware('/servicios-publicos'), serviciosPublicosRoutes);

// Middleware para manejar rutas no encontradas y errores
app.use(notFoundHandler);
app.use(errorHandler);

const server = http.createServer(app);
server.setTimeout(300000);
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;
