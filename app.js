const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

console.log('Iniciando aplicación...');
console.log('Directorio actual:', __dirname);
console.log('Contenido del directorio actual:', fs.readdirSync(__dirname));

// Manejo de promesas no capturadas
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Validación de variables de entorno
function validateEnv() {
    const required = ['PORT', 'NODE_ENV', 'CHAT_SERVICE_URL'];
    for (const variable of required) {
        if (!process.env[variable]) {
            throw new Error(`Environment variable ${variable} is missing`);
        }
    }
}

validateEnv();

const { logRouteMiddleware, errorHandler, notFoundHandler } = require('./middlewares/commonMiddlewares');
const telefoniaRoutes = require('./routes/telefoniaRoutes');
const serviciosPublicosRoutes = require('./routes/serviciosPublicosRoutes');

const app = express();

console.log("Configurando variables de entorno");
console.log("Variables de Entorno:");
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("CHAT_SERVICE_URL:", process.env.CHAT_SERVICE_URL);

// Configuración de CORS
const corsOptions = {
    origin: [
        'https://www.juridicaenlinea.co', 
        'https://juridica2-chat-3d0a7f266d9c.herokuapp.com',
        'http://localhost:3000'
    ],
    optionsSuccessStatus: 200,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
console.log("CORS configurado con:", corsOptions);

app.options('*', cors(corsOptions));

app.use((req, res, next) => {
    console.log(`Recibida solicitud ${req.method} para ${req.url}`);
    if (req.method === 'OPTIONS') {
        console.log('Recibida solicitud OPTIONS');
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Configuración del proxy para el chat
const chatProxy = createProxyMiddleware({ 
    target: process.env.CHAT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/chat': '/',
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ error: 'Proxy Error', message: err.message });
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log('Proxy Response:', proxyRes.statusCode);
    }
});

// Usar el proxy para /chat
app.use('/chat', chatProxy);
console.log(`Chat proxy configurado para: ${process.env.CHAT_SERVICE_URL}`);

// Middleware para servir archivos estáticos
const faviconPath = path.join(__dirname, 'landing/imagenespng/favicon');
const landingPath = path.join(__dirname, 'landing');
const imagesPath = path.join(__dirname, 'utils/images');
const frontendBuildPath = path.join(__dirname, 'frontend-build'); // Ajusta esta ruta según sea necesario

console.log("Ruta absoluta de favicon:", faviconPath);
console.log("Ruta absoluta de landing:", landingPath);
console.log("Ruta absoluta de images:", imagesPath);
console.log("Ruta absoluta del build del frontend:", frontendBuildPath);

app.use('/favicon', express.static(faviconPath));
app.use(express.static(landingPath));
app.use('/images', express.static(imagesPath));
app.use('/chat', express.static(frontendBuildPath)); // Servir archivos estáticos del frontend

// Healthcheck
app.get('/healthcheck', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Servir index.html desde la ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(landingPath, 'index.html'));
});

// Servir index.html para la ruta /chat/room y cualquier otra ruta bajo /chat
app.get(['/chat', '/chat/*'], (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

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
    console.log('Rutas configuradas:');
    console.log('- / (Landing page)');
    console.log('- /telefonia');
    console.log('- /servicios-publicos');
    console.log('- /chat (proxy y frontend)');
    console.log('- /healthcheck');
});

module.exports = app;