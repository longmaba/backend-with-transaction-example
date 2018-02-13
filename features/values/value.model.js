module.exports = mongoose => {
  return mongoose.model(
    'Value',
    {
      key: {
        type: String,
        index: true
      },
      value: mongoose.Schema.Types.Mixed
    },
    'value'
  );
};
