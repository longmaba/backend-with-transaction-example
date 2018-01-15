const [requires, func] = [
  'models.User, error',
  (User, error) => {
    const UserService = {};

    return UserService;
  }
];

module.exports = {
  requires,
  func
};
