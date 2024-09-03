// services/common/CreditService.js (actualización)
const User = require('../../models/User');
const Credit = require('../../models/Credit');
const creditCalculator = require('../../utils/creditCalculator');
const PurchaseHistory = require('../../models/PurchaseHistory');

class CreditService {
  async purchaseCredits(userId, amount) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      user.creditBalance += amount;
      await user.save();

      const purchaseRecord = new PurchaseHistory({
        userId,
        amount,
        credits: amount, // Asumiendo que 1 crédito = 1 unidad de moneda
        date: new Date()
      });
      await purchaseRecord.save();

      return {
        newBalance: user.creditBalance,
        purchase: purchaseRecord
      };
    } catch (error) {
      console.error('Error purchasing credits:', error);
      throw new Error('Error al comprar créditos');
    }
  }


  async consumeCredits(userId, action) {
    const creditCost = creditCalculator.calculateCost(action);
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.creditBalance < creditCost) {
      throw new Error('Insufficient credits');
    }

    const oldBalance = user.creditBalance;
    user.creditBalance -= creditCost;
    await user.save();

    const transaction = await new Credit({
      user: userId,
      amount: -creditCost,
      type: 'consumption',
      description: `Credit consumption for ${action}`
    }).save();

    return {
      balance: user.creditBalance,
      consumed: creditCost,
      transactionId: transaction._id.toString(),
      oldBalance: oldBalance,
      action: action
    };
  }

  async getCreditBalance(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return { balance: user.creditBalance };
  }

  async getPurchaseHistory(userId) {
    try {
      const history = await PurchaseHistory.find({ userId }).sort({ date: -1 });
      return history;
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      throw new Error('Error al obtener el historial de compras');
    }
  }
}

module.exports = new CreditService();