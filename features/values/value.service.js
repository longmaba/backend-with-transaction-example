const [requires, func] = [
  'models.Value',
  Value => {
    const ValueService = {};

    ValueService.set = async (key, value) => {
      let pair = await Value.findOne({ key });
      if (!pair) {
        pair = new Value({
          key,
          value,
          history: []
        });
      } else {
        pair.history = [...pair.history, pair.value];
        pair.value = value;
      }
      await pair.save();
      return pair;
    };

    ValueService.delete = key => {
      return ValueService.set(key, null);
    };

    ValueService.get = async key => {
      const pair = await Value.findOne({ key });
      if (pair) {
        return pair.value;
      }
      return undefined;
    };

    return ValueService;
  }  
];

module.exports = {
  require: requires,
  func
};