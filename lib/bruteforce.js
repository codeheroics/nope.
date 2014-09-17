'use strict';
var moment       = require('moment');
var ExpressBrute = require('express-brute');
var RedisStore   = require('express-brute-redis');
var winston      = require('winston');

var store = new RedisStore({
    host: '127.0.0.1',
    port: 6379
});
var bruteforce = new ExpressBrute(store);

var failCallback = function (req, res, next, nextValidRequestDate) {
  winston.info(req.body.email, ' - bruteforce temp ban until ' + nextValidRequestDate);
  var message = 'You\'ve made too many failed attempts in a short period of time, please try again ' +
    moment(nextValidRequestDate).fromNow();
  res.jsonp(403, {
    title: 'Too many requests',
    detail: message
  });
};

// Start slowing requests after 5 failed attempts to do something for the same user
var userBruteforce = new ExpressBrute(store, {
  freeRetries: 10,
  proxyDepth: 1,
  minWait: 5*60*1000, // 5 minutes
  maxWait: 60*60*1000, // 1 hour,
  failCallback: failCallback
});
// No more than 1000 login attempts per day per IP
var globalBruteforce = new ExpressBrute(store, {
  freeRetries: 1000,
  proxyDepth: 1,
  attachResetToRequest: false,
  refreshTimeoutOnRequest: false,
  minWait: 25*60*60*1000, // 1 day 1 hour (should never reach this wait time)
  maxWait: 25*60*60*1000, // 1 day 1 hour (should never reach this wait time)
  lifetime: 24*60*60, // 1 day (seconds not milliseconds)
  failCallback: failCallback
});

module.exports = {
  user: userBruteforce,
  global: globalBruteforce
};
