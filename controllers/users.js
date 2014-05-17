'use strict';


var User = require('../models/user');

var isLoggedIn = require('../lib/utils/middlewares').isLoggedInJSON;

module.exports = function(app) {
  // Send a friend request
  // TODO check email validity to avoid querying empty slots ?
  app.post('/friends', isLoggedIn, function(req, res, next) {
    // TODO Add email validator
    if (!req.body.friendEmail) return res.jsonp(400, {message: 'Invalid E-mail'})
    var friendEmail = req.body.friendEmail.toLowerCase().trim();
    req.user.sendFriendRequest(friendEmail, function(err, status) {
      if (err) return next(err);
      // TODO Send an e-mail to the unexisting user ? --> Propose this in-app to the current user ?
      return res.jsonp({message: status});
    });
  });

};
