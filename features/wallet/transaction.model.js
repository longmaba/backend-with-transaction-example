module.exports = mongoose => {
  return mongoose.model(
    'Transaction',
    {
      userId: mongoose.Schema.ObjectId,
      currency: String,
      key: String,
      amount: String,
      data: mongoose.Schema.Types.Mixed,
      date: Date
    },
    'transaction'
  );
};
