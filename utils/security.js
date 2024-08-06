const crypto = require('crypto');

// Claves del webhook para los diferentes servicios
const chatbaseSecrets = {
    telefonia: process.env.CHATBASE_SECRET_TELEFONIA,
    servicios_publicos: process.env.CHATBASE_SECRET_SERVICIOS_PUBLICOS
};

// Función para verificar la firma
function verifySignature(service, signature, rawBody) {
    // Seleccionar la clave secreta adecuada basada en el servicio
    const chatbaseSecret = chatbaseSecrets[service];
    if (!chatbaseSecret) {
        console.error(`Clave secreta no encontrada para el servicio: ${service}`);
        return false;
    }

    // Crear HMAC utilizando la clave secreta y el cuerpo del mensaje
    const computedSignature = crypto.createHmac('sha1', chatbaseSecret).update(rawBody).digest('hex');

    // Comparar la firma calculada con la firma recibida
    const isValid = signature === computedSignature;
    
    return isValid;
}

module.exports = {
    verifySignature,
};
