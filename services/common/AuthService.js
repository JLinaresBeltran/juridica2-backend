// 3. services/common/AuthService.js
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const bcrypt = require('bcrypt');

class AuthService {
  async register(username, email, password) {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    const user = new User({ username, email, password });
    await user.save();
    return this.generateToken(user);
  }

  async login(username, password) {
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Invalid credentials');
    }
    return this.generateToken(user);
  }

  generateToken(user) {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  }

  async resetPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    // Generar token temporal
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // Aquí deberías enviar un email con el enlace de restablecimiento
    // Por ahora, solo retornamos el token (no hagas esto en producción)
    return resetToken;
  }
}

module.exports = new AuthService();