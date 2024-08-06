// Middleware para registrar las rutas accedidas
const logRouteMiddleware = (route) => (req, res, next) => {
    console.log(` Ruta Accedida: ${route}`, req.method, req.path);
    next();
};

// Manejador para rutas no encontradas
const notFoundHandler = (req, res) => {
    console.log(` Ruta no encontrada:`, req.method, req.path);
    res.status(404).send("Lo siento, esa ruta no existe.");
};

// Manejador de errores
const errorHandler = (err, req, res, next) => {
    console.error(`[errorHandler] Error capturado:`, err.stack);
    res.status(500).send('¡Algo salió mal!');
    // next(err); // Descomentar si tienes un manejador de errores adicional después de este
};

module.exports = {
    logRouteMiddleware,
    notFoundHandler,
    errorHandler
};
