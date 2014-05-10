'use strict';


var User = require('../models/user');

module.exports = function (app) {

  // before getting here, check whether user is logged (if not, exit)

  // Dunno why I would want to get infos on a user
  /*app.get('/:email', function(req, res, next) {
    User.findById(req.params.email, function(err, user) {
      if (err) return next(err);

      if (!user.hasFriend(req.loggedInUser)) return next(new Error('Cannot get information on that user'));
    });
  });*/

};
