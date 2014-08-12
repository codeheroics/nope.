'use strict';

var passport = require('passport');
var moment = require('moment');
var jwt = require('jwt-simple');
var config = require('config');
var log = require('winston');

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

   var outputSignupSuccess = function(req, res) {
    res.jsonp(
      200,
      req.user.toSelfJSON()
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

   var createAndOutputToken = function(req, res, next) {
    if (!req.user || !req.user.email) {
      log.error('Tried creating token with no user email', req.user);
      return outputLoginError(req, res);
    }
      var token = jwt.encode({
        email: req.user.email
      }, config.jwtTokenSecret);

      res.jsonp(token);
   };

   // Route to check if logged in
   app.get('/login', isLoggedIn, function(req, res, next) {
    res.jsonp(200, {});
   });

  // process the login form
  app.post('/login', function(req, res, next) {
    passport.authenticate('local-login', function(err, user) {
      if (err) log.error(err.message, err);
      if (err || !user) return outputLoginError(req, res);

      req.user = user;
      createAndOutputToken(req, res);
    })(req, res);
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
      req.user = user;
      if (err || !user) return outputSignupError(err, req, res);
      outputSignupSuccess(req, res);
    })(req, res);
  });

  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get('/logout', function(req, res) {
    req.logout();
    //res.redirect('/');
  });
};
