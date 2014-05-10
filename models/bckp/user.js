var db = require('../lib/connection');

var User = function(params) {
  if (!params.name) throw new Error('No name');
  if (!params.email) throw new Error('No email');
  this.name = params.name;
  this.email = params.email.toLowerCase();
  this.friends = params.friends ? {} : undefined;
  this.score = params.score || 0;
};

User.prototype.findById = function(email, callback) {
  this.get(email.toLowerCase(), callback);
};

User.prototype.save = function(callback) {
  if (!this.email) return callback(new Error('No mail'));

  user.set(this.email.toLowerCase(), this, callback);
};

module.exports = User;
