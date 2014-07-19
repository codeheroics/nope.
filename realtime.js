'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var User = require('./models/user');

var app = express();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

var server = require('http').createServer(app);

//
// Attach Primus to the HTTP server.
//
var Primus = require('primus');
var primus = new Primus(server,  { transformer: 'engine.io' });

primus.authorize(require('./lib/utils/middlewares')(app).checkWebSocketLogin);

//
// Listen for connections and echo the events send.
//
primus.on('connection', function connection(spark) {
  // Can't keep the same user object in memory,
  // We remove it once his job is done, then get it again.
  var user = spark.request.user;
  var email = spark.request.user.email;
  user.addSpark(spark.id, function(err) {
    if (err) return console.error('addSpark error:', err);
    user = null;
  });

  spark.on('data', function received(opponentId) {

    User.findById(email, function(err, user) {
      if (err || !user) return console.error('Error fetching email ' + email, err);
      user.pokeAt(opponentId, function(err, pokeData) {
        if (err) {
          console.log('Error when ' + user.email + ' tried to poke ' + opponentId, err);
          spark.write('Nope, will not do that');
          return;
        }

        user.sparks.forEach(function(sparkId) {
          var spark = primus.spark(sparkId);
          console.log(spark, sparkId);
          if (spark) spark.write(formatPokeDataForPrimus(pokeData, opponentId));
        });

        User.findById(opponentId, function(err, opponent) {
          if (err || !opponent) return console.error('Error fetching email ' + email, err);
          opponent.sparks.forEach(function(opponentSparkId) {
            var opponentSpark = primus.spark(opponentSparkId);
            if (opponentSpark) opponentSpark.write(formatPokeDataForPrimus(opponent.friendsPokes[email], email));
          });
        });
      });
    });
  });

  spark.on('end', function endSparkConnection() {
    User.findById(email, function(err, user) {
      if (err || !user) return console.error('Error fetching email ' + email, err);
      user.removeSpark(spark.id, function(err) {
        if (err) {
          // NO RETURN IS WANTED, BUT DO NOT FORGET IT
          console.error('removeSpark error:', err);
        }
        user = null;
        email = null;
        console.log(spark.id, 'is gone');
      });
    });
  });
});

primus.on('error', function handleError(err) {
  console.error('An error has occured', err);
});

function formatPokeDataForPrimus(pokeData, email) {
  pokeData.email = email;
  return pokeData;
}

server.listen(8080, function () {
  console.log('Open http://localhost:8080 in your browser');
});
