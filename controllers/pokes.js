'use strict';

var Poke = require('../models/poke');
var User = require('../models/user');

module.exports = function (app) {
  // Before getting here, user must be logged in
  // if logged in, his data must be in req.loggedInUser

  app.get('/pokes/:opponentEmail', function (req, res) {
    // getting to sleep, now starting to wonder why everything's not on a single big collection
    user.get()
  });

};
