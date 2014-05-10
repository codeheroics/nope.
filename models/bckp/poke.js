var db = require('../lib/connection');

var Poke = function(params) {
  this._id = params._id;
  this.date = params.received || new Date();
  this.answered = params.answered || false;
  this.score = params.score || 0;
};

Poke.prototype.findById = function(id, callback) {
  this.get(id, callback);
};

Poke.prototype.save = function(callback) {
  if (!this._id) return callback(new Error('No id'));

  user.set(this._id, this, callback);
};

module.exports = Poke;
