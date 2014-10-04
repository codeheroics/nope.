'use strict';

var validator   = require('validator');
var winston     = require('winston');
var User        = require('../models/user');

module.exports = function(app) {
  var isLoggedIn  = require('../lib/utils/middlewares')(app).isLoggedIn;

  app.get('/users', isLoggedIn, function(req, res, next) {
    if (req.query.me === undefined) return res.jsonp(403, {message: 'Invalid'});
    res.jsonp(req.user.toSelfJSON());
  });

  app.get('/users/:email', isLoggedIn, function(req, res, next) {
    res.jsonp(req.user.toPublicJSON());
  });

  // Send a friend request
  app.post('/users', isLoggedIn, function(req, res, next) {
    var email = req.body.friendEmail && req.body.friendEmail.toLowerCase().trim();
    if (!validator.isEmail(email)) return res.jsonp(400, {message: 'Invalid E-mail'});
    req.user.sendFriendRequest(email, function(err, status, data) {
      if (err) {
        if (err instanceof User.FriendError) {
          return res.jsonp(403, { message: err.message, status: err.status });
        }
        winston.error('Server error while ' + req.user.email + ' tried to befriend' + email + ': ' + err.message, err);
        return res.jsonp(500, {});
      }

      var responseObject = { message: status };
      if (status === User.FRIEND_STATUSES.FRIEND) {
        responseObject.nopeData = data;
      } else if (status === User.FRIEND_STATUSES.PENDING) {
        responseObject.invitedUser = data;
      }

      return res.jsonp(responseObject);
    });
  });

  // Patch (my relationship) to an user
  app.patch('/users', isLoggedIn, function(req, res, next) {
    var email = req.body.friendEmail && req.body.friendEmail.toLowerCase().trim();
    if (!validator.isEmail(email)) return res.jsonp(400, {message: 'Invalid E-mail'});

    if (req.query.concede !== undefined) {
      return req.user.concedeAgainst(email, function(err, nopeInfos) {
        if (err) return next(err);

        res.jsonp({nopeData: nopeInfos});
      });
    }

    if (req.query.win !== undefined) {
      return req.user.declareVictoryAgainst(email, function(err, nopeInfos) {
        if (err) return next(err);

        res.jsonp({nopeData: nopeInfos});
      });
    }

    if (req.query.requestTruce !== undefined) {
      return req.user.requestTruce(email, function(err, nopeInfos) {
        if (err) return next(err);

        res.jsonp({nopeData: nopeInfos});
      });
    }

    if (req.query.breakTruce !== undefined) {
      return req.user.breakTruce(email, function(err, nopeInfos) {
        if (err) return next(err);

        res.jsonp({nopeData: nopeInfos});
      });
    }

    // unignore user
    // FIXME after a while, turn this on only when we have a req.query.unignore

    req.user.unIgnoreUser(email, function(err, status, nopeInfos) {
      if (err) return next(err);
      // We only have nopeInfos if we ignored the user before adding has a friend
      res.jsonp(nopeInfos ? {nopeData: nopeInfos} : 200);
    });
  });

  // Ignore an user
  app.delete('/users', isLoggedIn, function(req, res, next) {
    var email = req.body.friendEmail && req.body.friendEmail.toLowerCase().trim();
    if (!validator.isEmail(email)) return res.jsonp(400, {message: 'Invalid E-mail'});
    req.user.ignoreUser(email, function(err) {
      if (err) return next(err);
      res.jsonp(200);
    });
  });
};
