const almacenamientoVectorial = require('../../almacenamiento/almacenamientoVectorial');

class ControladorChatJuridico {
  async procesarConsulta(req, res) {
    try {
      const { consulta } = req.body;
      const resultados = await almacenamientoVectorial.buscarSimilares(consulta);
      
      const respuesta = resultados.map(resultado => ({
        texto: resultado.contenido,
        citacion: resultado.citacion
      }));
      
      res.json({ respuesta });
    } catch (error) {
      console.error('Error en la consulta:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = new ControladorChatJuridico();