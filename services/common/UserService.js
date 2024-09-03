// 4. services/common/UserService.js
const User = require('../../models/User');

class UserService {
  async updateProfile(userId, profileData) {
    const user = await User.findByIdAndUpdate(userId, profileData, { new: true });
    user.isProfileComplete = this.checkProfileCompletion(user);
    await user.save();
    return user;
  }

  checkProfileCompletion(user) {
    return !!(user.fullName && user.phoneNumber && user.address);
  }

  async updateLastActivity(userId) {
    await User.findByIdAndUpdate(userId, { lastActivity: new Date() });
  }
}

module.exports = new UserService();