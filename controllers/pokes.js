'use strict';

var validator = require('validator');
var Poke      = require('../models/poke');
var User      = require('../models/user');

var isLoggedIn = require('../lib/utils/middlewares').isLoggedInJSON;

module.exports = function (app) {

  app.get('/pokes', isLoggedIn, function(req, res) {
    res.jsonp(req.user.toPublicJSON());
  });

  app.post('/pokes', isLoggedIn, function(req, res, next) {
    if (!validator.isEmail(req.body.friendEmail)) return res.jsonp(400, {message: 'Invalid E-mail'});

    // Needs to be in the query to accept friend
    if (req.query.acceptFriend || req.body.acceptFriend) {
      req.user.removeFromPendingUsers(req.body.opponentEmail);
    }
    req.user.pokeAt(req.body.friendEmail.toLowerCase().trim(), function(err, result) {
      if (err) return next(err);
      res.jsonp({ message: result });
    });
  });
};
