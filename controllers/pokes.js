'use strict';

var Poke = require('../models/poke');
var User = require('../models/user');

module.exports = function (app) {

  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();

    res.jsonp(
      401,
      {
        title: 'Unauthorized',
        detail: 'Login needed'
      }
    );
  }

  // Before getting here, user must be logged in
  // if logged in, his data must be in req.loggedInUser

  app.get('/pokes', isLoggedIn, function(req, res) {
    res.jsonp(req.user.toPublicJSON());
  });

  app.get('/pokes/:opponentEmail', function (req, res) {
    // getting to sleep, now starting to wonder why everything's not on a single big collection
    user.get()
  });

};
