'use strict';

var config    = require('config');
var validator = require('validator');
var jwt       = require('jwt-simple');
var User      = require('../../models/user');

module.exports = function(app) {

  return {
    isLoggedIn: function(req, res, next) {

      var outputLoginError = function() {
        res.jsonp(
          401,
          {
            title: 'Unauthorized',
            detail: 'Login needed'
          }
        );
       };

      var token = req.headers['x-access-token'] ||
        req.body.access_token ||
        req.query.access_token;

      if (!token) return outputLoginError();

      var decoded = jwt.decode(token, config.jwtTokenSecret);
      // if user is authenticated in the session, carry on
      if (!validator.isEmail(decoded.email)) {
         return outputLoginError();
      }

      User.findById(decoded.email, function(err, user) {
        if (err || !user) return outputLoginError();
        req.user = user;

        next();
      });

    }
  };
};
