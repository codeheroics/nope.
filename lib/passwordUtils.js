/**
 * Password utilities
 */

var bcrypt = require('bcrypt');

module.exports = {
  generateHash = function(password, callback) {
    bcrypt.genSalt(8, function(err, salt) {
	  if (err) return callback(err);
	  bcrypt.hash(password, salt, null, callback);
	});
  };
  
  validatePassword = function(password, encryptedPassword, callback) {
    return bcrypt.compare(password, encryptedPassword, callback);
  };
};