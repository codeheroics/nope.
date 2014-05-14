'use strict';

var kraken    = require('kraken-js');
var app       = {};

var flash     = require('connect-flash');
var passport  = require('passport');
require('./lib/passport')(passport);

app.configure = function configure(nconf, next) {
  // Async method run on startup.
  next(null);
};


app.requestStart = function requestStart(server) {
  // Run before most express middleware has been registered.
};


app.requestBeforeRoute = function requestBeforeRoute(server) {
  server.use(passport.initialize());
  server.use(passport.session()); // persistent login sessions
  server.use(flash()); // use connect-flash for flash messages stored in session

  // required for passport
  //server.use(server.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
};


app.requestAfterRoute = function requestAfterRoute(server) {
  // Run after all routes have been added.
};


if (require.main === module) {
  kraken.create(app).listen(function (err, server) {
    if (err) {
      console.error(err.stack);
    }
  });
}


module.exports = app;
