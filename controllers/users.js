'use strict';

var validator   = require('validator');
var User        = require('../models/user');
var isLoggedIn  = require('../lib/utils/middlewares').isLoggedInJSON;

module.exports = function(app) {
  app.get('/users/:email', isLoggedIn, function(req, res, next) {

  });

  // Send a friend request
  app.post('/friends', isLoggedIn, function(req, res, next) {
    if (!validator.isEmail(req.body.friendEmail)) return res.jsonp(400, {message: 'Invalid E-mail'});
    var friendEmail = req.body.friendEmail.toLowerCase().trim();
    req.user.sendFriendRequest(friendEmail, function(err, status) {
      if (err) {
        if (err instanceof User.FriendError) {
          return res.jsonp(403, { message: err.message, status: err.status });
        }
        return res.jsonp(500, { message: err.message });
      }
      // TODO Send an e-mail to the unexisting user ? --> Propose this in-app to the current user ?
      return res.jsonp({message: status});
    });
  });
};
