'use strict';
module.exports = {
  isLoggedInWeb: function(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
      return next();

    // if they aren't redirect them to the home page
    res.redirect('/app.html#/login');
  },

  isLoggedInJSON: function(req, res, next) {
    if (req.isAuthenticated()) return next();

    res.jsonp(
      401,
      {
        title: 'Unauthorized',
        detail: 'Login needed'
      }
    );
  }
};
