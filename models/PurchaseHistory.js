const mongoose = require('mongoose');

const PurchaseHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  credits: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PurchaseHistory', PurchaseHistorySchema);