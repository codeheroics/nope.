'use strict';

var moment        = require('moment');
var jwt           = require('jwt-simple');
var config        = require('config');
var log           = require('winston');
var passport      = require('passport');
var validator     = require('validator');
var winston       = require('winston');

var User          = require('../models/user');
var mail          = require('../lib/mail');
var bruteforce    = require('../lib/bruteforce');
var passwordUtils = require('../lib/utils/password');
var uuid          = require('node-uuid');

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
      email: user.email,
      random: uuid.v4() // Random token as salt to complexify the token, not used.
    }, config[tokenSecretLabel]);
  };

   var createAccessToken = createToken.bind(this, 'jwtTokenSecret'); // FIXME add salt to these
   var createConfirmToken = createToken.bind(this, 'jwtTokenSecretForConfirm'); // FIXME add salt to these

   // Route to check if logged in
   app.get('/login', isLoggedIn, function(req, res, next) {
    res.jsonp(200, {});
   });

  // process the login form
  app.post(
    '/login',
    bruteforce.global.prevent,
    bruteforce.user.getMiddleware({
        key: function(req, res, next) {
          // prevent too many attempts for the same username
          next(req.body.email);
        }
    }),
    function(req, res, next) {
    passport.authenticate('local-login', function(err, user) {
      if (err) log.error(err.message, err);
      if (err || !user) return outputLoginError(req, res);

      req.brute.reset(function() {}); // Don't wanna condition the next step to this

      if (!user.confirmed) {
        return res.jsonp(
          403,
          {
            title: 'Unconfirmed',
            detail: 'Confirmation needed'
          }
        );
      }

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
        if (err) winston.error('error while sending confirmation email:' + err.message, err);
        // TODO signal to the user if error
        res.jsonp(null);
      });
    })(req, res, next);
  });

  app.get('/confirm', function(req, res, next) {
    if (!req.query.token) return outputConfirmError(null, req, res);

    var decoded;
    try {
      decoded = jwt.decode(req.query.token, config.jwtTokenSecretForConfirm);
    }
    catch(err) {
      return outputConfirmError(null, req, res);
    }

    User.findById(decoded.email, function(err, user) {
      if (err || !user) return outputConfirmError(err, req, res);
      user.confirmed = true;
      user.save(function(err) {
        if (err) return outputConfirmError(err, req, res);
        // if (req.xhr) return res.jsonp(null);
        res.redirect('/app.html#/login?confirmed');
      });
    });
  });

  app.post(
    '/forgotten-password',
    bruteforce.global.prevent,
    bruteforce.user.getMiddleware({
        key: function(req, res, next) {
          // prevent too many attempts for the same username
          next(req.body.email);
        }
    }),
    function(req, res, next) {
      if (!req.body.email) return res.jsonp(400, {});
      var email = req.body.email.trim();
      if (! validator.isEmail(email)) return res.jsonp(400, {});

      User.findById(email, function(err, user) {
        if (err) return next(err);
        if (!user) return res.jsonp(404, {});

        // "Enhance your calm" if too many request too fast
        if (user.passwordReset.time > Date.now() - 300000) return res.jsonp(420, {});

        user.passwordReset.time = Date.now();
        user.passwordReset.resetToken = uuid.v4();

        user.save(function(err) {
          if (err) return next(err);

          var jwtToken = jwt.encode({
            email: user.email,
            resetToken: user.passwordReset.resetToken
          }, config.jwtTokenSecretForPassword);

          mail.sendForgottenPasswordEmail(email, jwtToken, function(err) {
            if (err) return next(err);
            return res.jsonp(200, {});
          });
        });
      });
    }
  );


  app.get('/password-reset', function(req, res, next) {
    res.redirect('/app.html#/password-reset?resetToken=' + req.query.token);
  });

  app.post('/password-reset', function(req, res, next) {
    if (!req.body.password || !req.body.token) return res.jsonp(400, {});

    var decoded;
    try {
      decoded = jwt.decode(req.body.token, config.jwtTokenSecretForPassword);
    }
    catch(err) {
      return outputConfirmError(null, req, res);
    }

    var resetToken = decoded.resetToken;
    var email = decoded.email;

    if (!resetToken || !email) return res.jsonp(400, {});

    User.findById(email, function(err, user) {
      if (err) return next(err);
      if (!user) return res.jsonp(404, {});
      if (user.passwordReset.resetToken !== resetToken) return res.jsonp(403, {});

      passwordUtils.generateHash(req.body.password, function(err, hash) {
        if (err) return next(err);
        user.password = hash;
        delete user.passwordReset.resetToken; // Do not remove time to allow "enhance your calm" check
        user.save(function(err) {
          if (err) return next(err);
          res.jsonp(200, {});
        });
      });
    });
  });

  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get('/logout', function(req, res) {
    req.logout();
  });
};
