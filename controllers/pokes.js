'use strict';

var validator = require('validator');
var Poke      = require('../models/poke');
var User      = require('../models/user');

module.exports = function (app) {
  var isLoggedIn = require('../lib/utils/middlewares')(app).isLoggedIn;

  app.get('/pokes', isLoggedIn, function(req, res) {
    // TODO implement a parameter "since", and only send back friendsPokes from then
    res.jsonp(req.user.friendsPokes);
  });

  app.post('/pokes', isLoggedIn, function(req, res, next) {
    if (!validator.isEmail(req.body.friendEmail)) return res.jsonp(400, {message: 'Invalid E-mail'});

    req.user.pokeAt(req.body.friendEmail.toLowerCase().trim(), function(err, pokeInfos) {
      if (err) {
        if (err instanceof User.FriendError || err instanceof User.PokeError) {
          return res.jsonp(403, { message: err.message, status: err.status });
        }
        return res.jsonp(500, { message: err.message });
      }

      res.jsonp(pokeInfos);
    });
  });
};
