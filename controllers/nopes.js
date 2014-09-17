'use strict';

var validator = require('validator');
var winston   = require('winston');
var User      = require('../models/user');

module.exports = function (app) {
  var isLoggedIn = require('../lib/utils/middlewares')(app).isLoggedIn;

  app.get('/nopes', isLoggedIn, function(req, res) {
    if (!req.query.since && !req.query.from) return res.jsonp(req.user.friendsNopes);

    var filteredFriendsNopes = {};

    if (req.query.since) {
      var since = parseInt(req.query.since, 10);
      if (isNaN(since)) return res.status(400);
      for (var email in req.user.friendsNopes) {
        if (!req.user.friendsNopes.hasOwnProperty(email)) continue;
        if (req.user.friendsNopes[email].time < since) continue;
          filteredFriendsNopes[email] = req.user.friendsNopes[email];
      }
      return res.jsonp(filteredFriendsNopes);
    }

    if (req.query.from && req.user.friendsNopes[req.query.from]) {
      return res.jsonp(req.user.friendsNopes[req.query.from]);
    }

    return res.status(400);
  });

  app.post('/nopes', isLoggedIn, function(req, res, next) {
    if (!validator.isEmail(req.body.friendEmail)) return res.jsonp(400, {message: 'Invalid E-mail'});

    req.user.nopeAt(req.body.friendEmail.toLowerCase().trim(), function(err, nopeInfos) {
      if (err) {
        if (err instanceof User.FriendError || err instanceof User.NopeError) {
          return res.jsonp(403, { message: err.message, status: err.status });
        }
        winston.error('Server error while ' + req.user.email + ' tried to poke' + req.body.friendEmail, err);
        return res.jsonp(500, {});
      }

      res.jsonp(nopeInfos);
    });
  });
};
