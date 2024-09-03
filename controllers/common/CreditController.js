const CreditService = require('../../services/common/CreditService');

class CreditController {
  async purchaseCredits(req, res) {
    try {
      const userId = req.user.id;
      const { amount } = req.body;
      const result = await CreditService.purchaseCredits(userId, amount);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async consumeCredits(req, res) {
    try {
      const userId = req.user.id;
      const { action } = req.body;
      const result = await CreditService.consumeCredits(userId, action);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getCreditBalance(req, res) {
    try {
      const userId = req.user.id;
      const balance = await CreditService.getCreditBalance(userId);
      res.json(balance);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }


  async getPurchaseHistory(req, res) {
  try {
    const userId = req.user.id;
    const history = await CreditService.getPurchaseHistory(userId);
    res.json(history);
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(400).json({ message: error.message });
  }
}
}

module.exports = new CreditController();