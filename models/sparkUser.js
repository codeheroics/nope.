'use strict';
var validator   = require('validator');
var memcached   = require('../lib/connection').memcached;

var SparkUser = function(params) {
  if (!params.email) throw new Error('no Email');
  this.email = params.email.toLowerCase();
  this.sparks = params.sparks || [];
};

SparkUser.findById = function(email, callback) {
  email = email.toLowerCase();
  memcached.get(email, function(err, result) {
    if (err) return callback(err);
    if (!result || !result.value) return callback(null, null);
    callback(null, new SparkUser({email: email, sparks: result.value}));
  });
};

SparkUser.prototype.addSpark = function(sparkId, callback) {
  this.sparks.push(sparkId);
  this.save(callback);
};

SparkUser.prototype.removeSpark = function(sparkId, callback) {
  var sparkIndex = this.sparks.indexOf(sparkId);
  if (sparkIndex === -1) return;
  this.sparks.splice(sparkIndex, 1);
  this.save(callback);
};

SparkUser.prototype.save = function(callback) {
  memcached.set(this.email, this.sparks, callback);
};

module.exports = SparkUser;
