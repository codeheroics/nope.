'use strict';

var moment    = require('moment');
var jwt       = require('jwt-simple');
var config    = require('config');
var log       = require('winston');
var passport  = require('passport');
var validator = require('validator');
var User      = require('../models/user');
var mail      = require('../lib/mail');

module.exports = function(app) {
  var isLoggedIn = require('../lib/utils/middlewares')(app).isLoggedIn;

  var outputLoginError = function(req, res) {
    res.jsonp(
      401,
      {
        title: 'Unauthorized',
        detail: 'Login needed'
      }
    );
   };

  var outputSignupError = function(err, req, res) {
    res.jsonp(
      err ? 500 : 403,
      {
        message: err ? 'server error' : 'email already in use'
      }
    );
  };

  var outputConfirmError = function(err, req, res) {
    res.jsonp(
      err ? 500 : 403,
      {
        message: err ? 'server error, try again later' : 'token error'
      }
    );
  };

  var createToken = function(tokenSecretLabel, user) {
    return jwt.encode({
      email: user.email
    }, config[tokenSecretLabel]);
  };

   var createAccessToken = createToken.bind(this, 'jwtTokenSecret');
   var createConfirmToken = createToken.bind(this, 'jwtTokenSecretForEmail');

   // Route to check if logged in
   app.get('/login', isLoggedIn, function(req, res, next) {
    res.jsonp(200, {});
   });

  // process the login form
  app.post('/login', function(req, res, next) {
    passport.authenticate('local-login', function(err, user) {
      if (err) log.error(err.message, err);
      if (err || !user) return outputLoginError(req, res);

      res.jsonp(createAccessToken(user));
    })(req, res, next);
  });

  // =====================================
  // SIGNUP ==============================
  // =====================================
  // show the signup form
  app.get('/signup', function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('signup', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', function(req, res, next) {
    passport.authenticate('local-signup', function(err, user) {
      if (err) log.error(err.message, err);
      if (err || !user) return outputSignupError(err, req, res);

      mail.sendConfirmationMail(user, createConfirmToken(user), function(err, json) {
        console.log('TODO signal to the user if any problems');
        res.jsonp(null);
      });
    })(req, res, next);
  });

  app.get('/confirm', function(req, res, next) {
    if (!req.query.token) return outputConfirmError(new Error('Invalid token'), req, res);

    var decoded = jwt.decode(req.query.token, config.jwtTokenSecretForEmail);
      // if user is authenticated in the session, carry on
      if (!validator.isEmail(decoded.email)) {
         return outputConfirmError(new Error('Invalid token'), req, res);
      }

      User.findById(decoded.email, function(err, user) {
        if (err || !user) return outputConfirmError(err, req, res);
        user.confirmed = true;
        user.save(function(err) {
          if (err) return outputConfirmError(err, req, res);
          res.jsonp(null);
        });
      });

  });

  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get('/logout', function(req, res) {
    req.logout();
    //res.redirect('/');
  });
};
