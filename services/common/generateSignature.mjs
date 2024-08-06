// Importamos el módulo dotenv para cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

// Importamos el módulo crypto de Node.js
import crypto from 'crypto';

// Obtenemos el secreto de chatbase desde las variables de entorno
const secretKey = process.env.SECRET_KEY;

// Creamos el cuerpo del mensaje recibido en formato JSON
const rawBodyMessageReceived = JSON.stringify({
  eventType: 'message.received',
  payload: {
    conversation: { id: '12345' },
    message: { content: 'Este es un mensaje de prueba' }
  }
});

// Creamos el cuerpo de la conversación completada en formato JSON
const rawBodyConversationCompleted = JSON.stringify({
  eventType: 'conversation.completed',
  payload: {
    conversation: { id: '12345' }
  }
});

// Computamos la firma para el mensaje recibido usando HMAC-SHA1
let computedSignatureMessageReceived;
try {
  computedSignatureMessageReceived = crypto.createHmac('sha1', secretKey).update(rawBodyMessageReceived).digest('hex');
} catch (error) {
  console.error('Error al computar la firma para message.received:', error);
}

// Computamos la firma para la conversación completada usando HMAC-SHA1
let computedSignatureConversationCompleted;
try {
  computedSignatureConversationCompleted = crypto.createHmac('sha1', secretKey).update(rawBodyConversationCompleted).digest('hex');
} catch (error) {
  console.error('Error al computar la firma para conversation.completed:', error);
}
