module.exports = (mongoose, NestedSetPlugin) => {
  var schema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    referralCode: String,
    parentId: mongoose.Schema.ObjectId,
    isActivated: Boolean,
    tfaSecret: String,
    kycStatus: {
      type: String,
      enum: ['Unverified', 'Pending', 'Verified'],
      default: 'Unverified'
    },
    kycData: mongoose.Schema.Types.Mixed,
    isAdmin: Boolean
  });
  schema.plugin(NestedSetPlugin);
  return mongoose.model('User', schema, 'user');
};
