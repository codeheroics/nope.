'use strict';
var express    = require('express');
var bodyParser = require('body-parser');
var async      = require('async');
var config     = require('config');
var User       = require('./models/user');

var winston    = require('winston');
winston.add(winston.transports.File, { filename: './log/realtime.log' });
winston.remove(winston.transports.Console);

var app        = express();

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

//
// Listen for connections and echo the events send.
//
primus.on('connection', function connection(spark) {
  // Can't keep the same user object in memory,
  // We remove it once his job is done, then get it again.

  var email = spark.request.user.email;
  spark.request = null; // Cleanup of useless data

  spark.join(email);

  spark.on('data', function received(opponentId) {
    User.findById(email, function(err, user) {
      if (err || !user) return console.error('Error fetching email ' + email, err);
      user.nopeAt(opponentId, function(err) {
        if (!err) return;
        console.error('Error when ' + email + ' tried to nope ' + opponentId, err);
        spark.write('Nope, will not do that');
      });
    });
  });

  // spark.on('end', function endSparkConnection() {
  //   // Remove room ? Is that necessary ?
  // });
});

primus.on('error', function handleError(err) {
  console.error('An error has occured', err);
});

server.listen(8080, function () {
  console.log(new Date(), 'realtime.js has started');
});
