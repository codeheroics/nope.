'use strict';
var express    = require('express');
var bodyParser = require('body-parser');
var async      = require('async');
var config     = require('config');
var winston    = require('winston');
var User       = require('./models/user');

try { require('fs').mkdirSync('./log'); } catch (e) {} // if ./log doesn't exist.
winston.add(winston.transports.File, { filename: './log/realtime.log' });
if (process.env.NODE_ENV === 'production') winston.remove(winston.transports.Console);

var app = express();
app.use(bodyParser.json());

var server = require('http').createServer(app);

//
// Attach Primus to the HTTP server.
//
var Primus = require('primus');
var PrimusRedisRooms = require('primus-redis-rooms');

var primus = new Primus(
  server,
  {
    transformer: 'engine.io',
    redis: {
      host: 'localhost',
      port: 6379,
      channel: config.primusChannel
    }
  }
);

primus.use('redis', PrimusRedisRooms);

primus.authorize(require('./lib/utils/middlewares')(app).checkWebSocketLogin);

primus.on('connection', function connection(spark) {
  var email = spark.request.user.email;
  spark.join(email);

  // We write to the user the current time so he knows the difference
  // between him and the server
  spark.write({time: Date.now()});
});

primus.on('error', function handleError(err) {
  winston.warning('An error has occured with primus', err);
});

server.listen(8080, function () {
  winston.info(
    'realtime.js has started. Primus channel : ' + config.primusChannel
  );
});
