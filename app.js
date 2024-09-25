const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const mongoose = require('mongoose');
const { initializeLegalAdvisor } = require('./utils/legalAdvisor');
const AlmacenamientoVectorial = require('./almacenamiento/almacenamientoVectorial');


console.log('Iniciando aplicación...');
console.log('Directorio actual:', __dirname);
console.log('Contenido del directorio actual:', fs.readdirSync(__dirname));

// Manejo de promesas no capturadas
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

const isProduction = process.env.NODE_ENV === 'production';

// Validación de variables de entorno
function validateEnv() {
    const required = ['PORT', 'NODE_ENV', 'CHAT_SERVICE_URL', 'JWT_SECRET', 'OPENAI_API_KEY'];
    if (!isProduction) {
        required.push('MONGODB_URI');
    }
    for (const variable of required) {
        if (!process.env[variable]) {
            throw new Error(`Environment variable ${variable} is missing`);
        }
    }
}

validateEnv();

// Importación de middlewares y rutas
const { logRouteMiddleware, errorHandler, notFoundHandler } = require('./middlewares/commonMiddlewares');
const telefoniaRoutes = require('./routes/telefoniaRoutes');
const serviciosPublicosRoutes = require('./routes/serviciosPublicosRoutes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const creditRoutes = require('./routes/credit');
const rutasChatJuridico = require('./routes/rutasChatJuridico');

// Inicialización de la aplicación Express
const app = express();

console.log("Configurando variables de entorno");
console.log("Variables de Entorno:");
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("CHAT_SERVICE_URL:", process.env.CHAT_SERVICE_URL);
if (!isProduction) {
    console.log("MONGODB_URI:", process.env.MONGODB_URI);
}

// Función de conexión a la base de datos
const connectDB = async () => {
    if (!isProduction) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('Conexión a MongoDB establecida');
        } catch (err) {
            console.error('Error al conectar a MongoDB:', err);
            process.exit(1);
        }
    } else {
        console.log('Ejecutando en producción sin conexión a MongoDB');
    }
};

// Conexión a la base de datos
connectDB();

if (!isProduction) {
    mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to db');
    });

    mongoose.connection.on('error', (err) => {
        console.log('Mongoose connection error: ' + err);
    });
}

// Configuración de CORS
const corsOptions = {
    origin: [
        'https://www.juridicaenlinea.co', 
        'http://www.juridicaenlinea.co',
        'https://juridica2-chat-3d0a7f266d9c.herokuapp.com',
        'http://localhost:3000',
        'https://localhost:3000'
    ],
    optionsSuccessStatus: 200,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Aplicar middlewares globales
app.use(cors(corsOptions));

// Middleware para parsear JSON con manejo de errores
app.use(express.json({ limit: '50mb' }), (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('JSON Parse Error:', err);
        return res.status(400).json({ error: 'Invalid JSON', details: err.message });
    }
    next();
});

console.log("CORS configurado con:", corsOptions);

// Logging mejorado
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
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

// Middleware para servir archivos estáticos
const faviconPath = path.join(__dirname, 'landing/imagenespng/favicon');
const landingPath = path.join(__dirname, 'landing');
const imagesPath = path.join(__dirname, 'utils/images');

console.log("Ruta absoluta de favicon:", faviconPath);
console.log("Ruta absoluta de landing:", landingPath);
console.log("Ruta absoluta de images:", imagesPath);

console.log("Contenido del directorio de imágenes:");
fs.readdir(imagesPath, (err, files) => {
    if (err) {
        console.error("Error al leer el directorio de imágenes:", err);
    } else {
        console.log(files);
    }
});

app.use('/favicon', express.static(faviconPath));
app.use('/', express.static(landingPath));
app.use('/images', express.static(imagesPath));

// Healthcheck
app.get('/healthcheck', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Servir index.html desde la ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(landingPath, 'index.html'));
});

// Usar el proxy para /chat
app.use('/chat', chatProxy);
app.use('/chat/*', chatProxy);
console.log(`Chat proxy configurado para: ${process.env.CHAT_SERVICE_URL}`);

// Rutas de la aplicación
app.use('/telefonia', logRouteMiddleware('/telefonia'), telefoniaRoutes);
app.use('/servicios-publicos', logRouteMiddleware('/servicios-publicos'), serviciosPublicosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/chat-juridico', rutasChatJuridico);

// Inicializar el asesor jurídico AI
let legalAdvisor;
(async () => {
  try {
    legalAdvisor = await initializeLegalAdvisor();
    console.log("Asesor jurídico AI con GPT-4 inicializado y listo para usar.");
  } catch (error) {
    console.error("Error al inicializar el asesor jurídico con GPT-4:", error);
  }
})();

// Nueva ruta para el asesor jurídico AI
app.post('/api/legal-advice', async (req, res) => {
    if (!legalAdvisor) {
        return res.status(503).json({ error: 'El asesor jurídico aún no está listo.' });
    }

    const { question } = req.body;
    try {
        const response = await legalAdvisor(question);
        res.json({ answer: response });
    } catch (error) {
        console.error('Error in legal advisor:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

// Nuevas rutas para agregar y eliminar códigos
app.post('/api/agregar-codigo', async (req, res) => {
    try {
        const { rutaArchivo, categoria } = req.body;
        if (!rutaArchivo || !categoria) {
            return res.status(400).json({ error: 'Se requiere rutaArchivo y categoria' });
        }
        await AlmacenamientoVectorial.agregarCodigo(rutaArchivo, categoria);
        res.json({ message: 'Código agregado exitosamente' });
    } catch (error) {
        console.error('Error al agregar código:', error);
        res.status(500).json({ error: 'Error al agregar código' });
    }
});

app.post('/api/eliminar-codigo', async (req, res) => {
    try {
      const { nombreArchivo } = req.body;
      if (!nombreArchivo) {
        return res.status(400).json({ error: 'Se requiere nombreArchivo' });
      }
      
      await AlmacenamientoVectorial.eliminarCodigo(nombreArchivo);
      await AlmacenamientoVectorial.verificarIntegridadAlmacenamiento();
      
      res.json({ message: 'Código eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar código:', error);
      res.status(500).json({ error: 'Error al eliminar código', details: error.message });
    }
  });

// Función para imprimir las rutas registradas
function printRoutes(app) {
    app._router.stack.forEach(function(r){
        if (r.route && r.route.path){
            console.log('Route registered:', r.route.path)
        }
    })
}

// Imprimir las rutas registradas
printRoutes(app);

// Manejar todas las demás rutas
app.get('*', (req, res) => {
    if (req.path === '/') {
        res.sendFile(path.join(landingPath, 'index.html'));
    } else {
        res.redirect('/chat');
    }
});

// Inicializar el almacenamiento vectorial
AlmacenamientoVectorial.inicializar().then(() => {
  console.log('Almacenamiento vectorial inicializado');
}).catch(error => {
  console.error('Error al inicializar el almacenamiento vectorial:', error);
});

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
    console.log('- /chat (proxy al frontend)');
    console.log('- /api/auth');
    console.log('- /api/user');
    console.log('- /api/credit');
    console.log('- /api/chat-juridico');
    console.log('- /api/legal-advice (Nuevo asesor jurídico AI)');
    console.log('- /api/agregar-codigo (Agregar nuevo código)');
    console.log('- /api/eliminar-codigo (Eliminar código existente)');
    console.log('- /healthcheck');
});

module.exports = app;