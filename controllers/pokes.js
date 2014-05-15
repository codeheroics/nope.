'use strict';

var Poke = require('../models/poke');
var User = require('../models/user');

var isLoggedIn = require('../lib/utils/middlewares').isLoggedInJSON;

module.exports = function (app) {

  app.get('/pokes', isLoggedIn, function(req, res) {
    res.jsonp(req.user.toPublicJSON());
  });

  app.post('/pokes/:opponentEmail', isLoggedIn, function(req, res, next) {
    if (req.query.acceptFriend) req.user.removeFromPendingUsers(req.params.opponentEmail); // Needs to be in the query to accept friend
    req.user.pokeAt(req.params.opponentEmail.toLowerCase().trim(), function(err) {
      if (err) return next(err);
      res.jsonp({message: 'ok'});
    });
  });

};
