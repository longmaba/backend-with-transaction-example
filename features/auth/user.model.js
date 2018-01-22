module.exports = (mongoose, NestedSetPlugin) => {
  var schema = new Schema({
    username: String,
    email: String,
    password: String,
    referralCode: String,
    refererId: mongoose.Schema.ObjectId,
    isActivated: Boolean
  });
  schema.plugin(NestedSetPlugin);
  return mongoose.model('User', schema, 'user');
};
