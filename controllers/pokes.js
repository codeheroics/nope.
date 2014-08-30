'use strict';

var validator = require('validator');
var User      = require('../models/user');

module.exports = function (app) {
  var isLoggedIn = require('../lib/utils/middlewares')(app).isLoggedIn;

  app.get('/pokes', isLoggedIn, function(req, res) {
    if (!req.query.since && !req.query.from) return res.jsonp(req.user.friendsPokes);

    var filteredFriendsPokes = {};

    if (req.query.since) {
      var since = parseInt(req.query.since, 10);
      if (isNaN(since)) return res.status(400);
      for (var email in req.user.friendsPokes) {
        if (!req.user.friendsPokes.hasOwnProperty(email)) continue;
        if (req.user.friendsPokes[email].time < since) continue;
          filteredFriendsPokes[email] = req.user.friendsPokes[email];
      }
      return res.jsonp(filteredFriendsPokes);
    }

    if (req.query.from && req.user.friendsPokes[req.query.from]) {
      return res.jsonp(req.user.friendsPokes[req.query.from]);
    }

    return res.status(400);
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
