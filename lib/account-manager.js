'use strict';

var crypto    = require('crypto');
var db        = require('./connection');
var moment    = require('moment');

var User      = require('../models/user');

/* login validation methods */

exports.autoLogin = function(email, password, callback)
{
  User.findById(email, function(err, o) {
    if (err) return callback(err);
    if (o){
      o.password === password ? callback(o) : callback(null);
    } else{
      callback(null);
    }
  });
};

exports.manualLogin = function(email, password, callback)
{
  User.findById(email, function(err, o) {
    if (err) return callback(err);
    if (!o){
      callback('user-not-found');
    } else{
      validatePassword(password, o.password, function(err, res) {
        if (res){
          callback(null, o);
        } else{
          callback('invalid-password');
        }
      });
    }
  });
};

/* record insertion, update & deletion methods */

exports.addNewAccount = function(newData, callback)
{
  newData.email = (newData.email || '').trim().toLowerCase();
  if (!newData.email) return callback('email-taken');
  User.findById(newData.email, function(err, o) {
    if (err) return callback(err);
    if (o){
      callback('email-taken');
    } else{
      saltAndHash(newData.password, function(hash){
        var newUser = new User({
          email: newData.email.toLowerCase(),
          password: hash,
          name: newData.name
        });

        newUser.save(callback);
      });
    }
  });
};

/**
 * FIXME maybe later but not for now
exports.updateAccount = function(newData, callback)
{
  User.findOne({user:newData.user}, function(e, o){
    o.name    = newData.name;
    o.email   = newData.email;
    o.country   = newData.country;
    if (newData.pass == ''){
      User.save(o, {safe: true}, function(err) {
        if (err) callback(err);
        else callback(null, o);
      });
    } else{
      saltAndHash(newData.pass, function(hash){
        o.pass = hash;
        User.save(o, {safe: true}, function(err) {
          if (err) callback(err);
          else callback(null, o);
        });
      });
    }
  });
}
*/

exports.updatePassword = function(email, newPass, callback)
{
  User.findById(email, function(err, user){
    if (err) return callback(err);

    saltAndHash(newPass, function(hash){
      user.password = hash;
      user.save(callback);
    });
  });
};

/* account lookup methods */
/**
 * FIXME before anything goes in production
exports.deleteAccount = function(id, callback)
{
  User.remove({_id: getObjectId(id)}, callback);
};
*/

exports.validateResetLink = function(email, passHash, callback)
{
  User.findById(email), function(err, user){
    if (err) return callback(err);
    if (!user || user.password !== passHash) return callback(null);
    callback(email);
  });
};

/* private encryption & validation methods */

var generateSalt = function()
{
  var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
  var salt = '';
  for (var i = 0; i < 10; i++) {
    var p = Math.floor(Math.random() * set.length);
    salt += set[p];
  }
  return salt;
};

var md5 = function(str) {
  return crypto.createHash('md5').update(str).digest('hex');
};

var saltAndHash = function(pass, callback)
{
  var salt = generateSalt();
  callback(salt + md5(pass + salt));
};

var validatePassword = function(plainPass, hashedPass, callback)
{
  var salt = hashedPass.substr(0, 10);
  var validHash = salt + md5(plainPass + salt);
  callback(null, hashedPass === validHash);
};

/* auxiliary methods */

var getObjectId = function(id)
{
  return User.db.bson_serializer.ObjectID.createFromHexString(id);
};

var findById = function(id, callback)
{
  User.findOne({_id: getObjectId(id)},
    function(e, res) {
    if (e) callback(e)
    else callback(null, res)
  });
};


var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
  User.find( { $or : a } ).toArray(
    function(e, results) {
    if (e) callback(e)
    else callback(null, results)
  });
}
