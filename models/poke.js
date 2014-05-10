'use strict';

var db = require('../lib/connection');

var Poke = function(params) {
  this._id = params._id;
  this.date = params.date || new Date();
  this.answered = params.answered || false;
  this.score = params.score || 0;
  this.cas = params.cas || null;
};

Poke.findById = function(id, callback) {
  this.get(id, function(err, result) {
    if (err) return callback(err);
    if (!result || !result.value) return callback(null, null);
    result.value.cas = result.cas;
    callback(null, new Poke(result.value));
  });
};

Poke.prototype.save = function(callback) {
  if (!this._id) return callback(new Error('No id'));

  var options = {};
  if (this.cas) {
    options.cas = this.cas;
  }

  db.set(this._id, this.toDbJSON(), options, callback);
};

Poke.prototype.toDbJSON = function() {
  return {
    date: this.date,
    answered: this.answered,
    score: this.score
  };
};


module.exports = Poke;
