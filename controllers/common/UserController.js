// controllers/common/UserController.js
const UserService = require('../../services/common/UserService');
const User = require('../../models/User');

class UserController {
  async getUserData(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select('-password');

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      res.status(500).json({ message: "Error al obtener datos del usuario", error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { fullName, phoneNumber, address } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          fullName,
          phoneNumber,
          address,
          isProfileComplete: true,
          $set: { updatedAt: new Date() }
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({
        message: "Perfil actualizado con éxito",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      res.status(400).json({ message: "Error al actualizar el perfil", error: error.message });
    }
  }

  async updateLastActivity(req, res) {
    try {
      const userId = req.user.id;
      await User.findByIdAndUpdate(userId, { lastActivity: new Date() });
      res.sendStatus(204);
    } catch (error) {
      console.error("Error al actualizar la última actividad:", error);
      res.status(400).json({ message: "Error al actualizar la última actividad", error: error.message });
    }
  }
}

module.exports = new UserController();