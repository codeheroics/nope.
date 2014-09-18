'use strict';

var config    = require('config');
var validator = require('validator');
var jwt       = require('jwt-simple');
var winston   = require('winston');

var User      = require('../../models/user');

module.exports = function(app) {
  var loginError = new Error('Login');

  function validateJsonToken(req, callback) {
      var token = req.headers['x-access-token'] ||
        (req.body && req.body.access_token) ||
        req.query.access_token;

      if (!token) return callback(loginError);

      var decoded = jwt.decode(token, config.jwtTokenSecret);
      // if user is authenticated in the session, carry on
      if (!validator.isEmail(decoded.email)) {
         return callback(loginError);
      }

      User.findById(decoded.email, function(err, user) {
        if (err || !user) return callback(loginError);
        req.user = user;

        callback();
      });
  }

  return {
    isLoggedIn: function(req, res, next) {
      validateJsonToken(req, function(err) {
        if (err) {
          return res.jsonp(
            401,
            {
              title: 'Unauthorized',
              detail: 'Login needed'
            }
          );
        }

        if (!req.user.confirmed) {
          winston.warning('This should not happen - unconfirmed user ' + req.user.email);
          return res.jsonp(
            403,
            {
              title: 'Unconfirmed',
              detail: 'Confirmation needed'
            }
          );
        }
        next();
      });
    },

    checkWebSocketLogin: function(req, done) {
      validateJsonToken(req, done);
    }
  };
};
