const AuthService = require('../../services/common/AuthService');
const User = require('../../models/User');
const ResetToken = require('../../models/ResetToken');
const emailModule = require('../../utils/emailModule');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthController {
  async register(req, res) {
    try {
      const { fullName, email, password } = req.body;
      
      if (!fullName || !email || !password) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
      }

      const token = await AuthService.register(fullName, email, password);
      res.status(201).json({ token });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { identifier, password } = req.body;
      console.log('Login attempt with:', { identifier, password: '********' });
  
      if (!identifier || !password) {
        return res.status(400).json({ message: "El identificador y la contraseña son obligatorios" });
      }
  
      const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }]
      });
  
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      
      // Actualizar última actividad
      user.lastActivity = new Date();
      await user.save();

      // Enviar respuesta con token y datos del usuario
      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          address: user.address,
          isProfileComplete: user.isProfileComplete,
          lastActivity: user.lastActivity
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Ocurrió un error durante el inicio de sesión" });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      
      if (!user) {
        // Enviamos una respuesta genérica por seguridad
        return res.json({ message: "Si existe una cuenta con este correo, se enviarán instrucciones para restablecer la contraseña." });
      }

      // Generar token único
      const token = crypto.randomBytes(20).toString('hex');
      
      // Guardar token en la base de datos
      await ResetToken.create({
        userId: user._id,
        token: token,
        expiresAt: new Date(Date.now() + 3600000) // Token válido por 1 hora
      });

      // Preparar los datos para el correo electrónico
      const lead = {
        email: user.email,
        name: user.fullName
      };

      // Enviar correo electrónico
      await emailModule.sendPasswordResetEmail(lead, token);

      res.json({ message: "Instrucciones para restablecer la contraseña han sido enviadas al correo electrónico." });
    } catch (error) {
      console.error('Error en resetPassword:', error);
      res.status(500).json({ message: "Error al procesar la solicitud de restablecimiento de contraseña." });
    }
  }

  async processPasswordReset(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      const resetRequest = await ResetToken.findOne({ 
        token: token,
        expiresAt: { $gt: new Date() }
      });

      if (!resetRequest) {
        return res.status(400).json({ message: "Token inválido o expirado." });
      }

      const user = await User.findById(resetRequest.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      // Actualizar la contraseña
      user.password = newPassword;  // Asumiendo que el modelo User tiene un middleware para hashear la contraseña
      await user.save();

      // Eliminar el token usado
      await ResetToken.deleteOne({ _id: resetRequest._id });

      res.json({ message: "Contraseña restablecida con éxito." });
    } catch (error) {
      console.error('Error en processPasswordReset:', error);
      res.status(500).json({ message: "Error al procesar el restablecimiento de contraseña." });
    }
  }
}

module.exports = new AuthController();