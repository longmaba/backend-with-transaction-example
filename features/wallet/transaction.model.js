module.exports = mongoose => {
  return mongoose.model(
    'Transaction',
    {
      userId: mongoose.Schema.ObjectId,
      currency: String,
      date: { type: Date, index: true },
      key: {
        type: String,
        unique: true
      },
      amount: String,
      data: mongoose.Schema.Types.Mixed
    },
    'transaction'
  );
};
