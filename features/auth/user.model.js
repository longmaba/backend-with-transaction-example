module.exports = mongoose => {
  return mongoose.model(
    'User',
    {
      username: String,
      email: String,
      password: String,
      referralCode: String,
      refererId: mongoose.Schema.ObjectId,
      isActivated: Boolean
    },
    'user'
  );
};
