const mongoose = require('mongoose');

const CreditTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['purchase', 'consumption'], required: true },
  description: { type: String },
  timestamp: { type: Date, default: Date.now }
});

CreditTransactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('CreditTransaction', CreditTransactionSchema);