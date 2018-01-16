module.exports = mongoose => {
  return mongoose.model(
    'Wallet',
    {
      userId: mongoose.Schema.ObjectId,
      address: String,
      privateKey: Buffer
    },
    'wallet'
  );
};
