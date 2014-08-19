'use strict';

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var User            = require('../models/user');
var passwordUtils   = require('./utils/password');

// expose this function to our app using module.exports
module.exports = function(passport) {

  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.email);
  });

  // used to deserialize the user
  passport.deserializeUser(function(email, done) {
    User.findById(email, function(err, user) {
      done(err, user);
    });
  });

  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-signup', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
  },
  function(req, email, password, done) {

    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
    User.findById(email, function(err, user) {
      // if there are any errors, return the error
      if (err)
        return done(err);

      // check to see if theres already a user with that email
      if (user) {
        return done(null, false);
      } else {

        // if there is no user with that email
        // create the user
        // set the user's local credentials
        passwordUtils.generateHash(password, function(err, hash) {
          if (err) return done(err);

          var newUser = new User({
            email:  email,
            password: hash,
            name: req.body.name.trim()
          });

          // save the user
          newUser.save(function(err) {
            return done(err, newUser);
          });
        });
      }

    });

  }));

  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-login', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
  },
  function(req, email, password, done) { // callback with email and password from our form

    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists

    User.findById(email, function(err, user) {
      // if there are any errors, return the error before anything else
      if (err) return done(err);

      // if no user is found, return the message
      if (!user) return done(null, false);

      // if the user is found but the password is wrong
      passwordUtils.validatePassword(password, user.password, function(err, isValid) {
        if (!isValid) return done(null, false);

        // all is well, return successful user
        return done(null, user);
      });
    });
  }));
};
