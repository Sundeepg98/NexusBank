const sessionController = require('./sessionController');
const passwordController = require('./passwordController');
const userController = require('./userController');
const { validatePassword } = require('../utils/passwordValidator');

module.exports = {
  ...sessionController,
  ...passwordController,
  register: userController.register,
  validatePassword
};
