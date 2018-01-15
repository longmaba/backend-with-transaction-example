module.exports = mongoose => {
  return mongoose.model(
    'User',
    {
      email: String,
      password: String,
      tfaSecret: String,
      referer: mongoose.Schema.ObjectId
    },
    'user'
  );
};
