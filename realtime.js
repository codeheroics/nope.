'use strict';
var express    = require('express');
var bodyParser = require('body-parser');
var async      = require('async');
var User       = require('./models/user');
var SparkUser  = require('./models/sparkUser');
var app        = express();

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

  var email = spark.request.user.email;
  SparkUser.findById(email, function(err, sparkUser) {
    if (err) return console.error('SparkUser error', err);
    if (!sparkUser) sparkUser = new SparkUser({email: email});

    spark.request.user = null;
    sparkUser.addSpark(spark.id, function(err) {
      if (err) return console.error('addSpark error:', err);

      spark.on('data', function received(opponentId) {
        SparkUser.findById(email, function(err, sparkUser) {
          if (err || !sparkUser) return console.error('sparkuser error', err, sparkUser);

          async.auto({
            poke: function(cbAuto) { // sends back pokeData
              User.findById(email, function(err, user) {
                if (err || !user) return console.error('Error fetching email ' + email, err);
                user.pokeAt(opponentId, cbAuto);
              });
            },

            notifyPoking: ['poke', function(cbAuto, results) {
              var pokeData = results.poke;

              // First give data back to this spark
              spark.write(formatPokeDataForPrimus(pokeData, opponentId));

              // Then to the others
              var sparkIds = sparkUser.sparks.slice(0);  // Copy for iteration
              sparkIds.forEach(function(sparkId) {
                if (sparkId === spark.id) return;
                var pokingSpark = primus.spark(sparkId);
                if (pokingSpark) {
                  pokingSpark.write(formatPokeDataForPrimus(pokeData, opponentId));
                } else {
                  sparkUser.removeSpark(sparkId, function(){}); // FIXME
                }
              });
              cbAuto();
            }],

            notifyPoked: ['poke', function(cbAuto, pokeData) {
              async.parallel({
                opponent: function(cbParallel) {
                  User.findById(opponentId, cbParallel);
                },
                sparkOpponent: function(cbParallel) {
                  SparkUser.findById(opponentId, cbParallel);
                }
              }, function(err, results) {
                var opponent = results.opponent;
                var sparkOpponent = results.sparkOpponent;
                if (err || !opponent || !sparkOpponent) {
                  return console.error('Error fetching email ' + opponentId, err, opponent, sparkOpponent);
                }


                var opponentSparksIds = sparkOpponent.sparks.slice(0); // Copy for iteration
                opponentSparksIds.forEach(function(opponentSparkId) {
                  var opponentSpark = primus.spark(opponentSparkId);
                  if (opponentSpark) {
                    opponentSpark.write(formatPokeDataForPrimus(opponent.friendsPokes[email], email));
                   } else {
                    sparkOpponent.removeSpark(opponentSparkId, function() {}); // FIXME
                  }
                });
                cbAuto();
              });
            }]
          }, function(err) {
            if (err) {
              console.error('Error when ' + email + ' tried to poke ' + opponentId, err);
              spark.write('Nope, will not do that');
            }
          });
        });
      });
    });
  });

  spark.on('end', function endSparkConnection() {
    SparkUser.findById(email, function(err, sparkUser) {
      if (err || !sparkUser) return console.error('Error fetching email ' + email, err);
      sparkUser.removeSpark(spark.id, function(err) {
        if (err) {
          console.error('removeSpark error:', err);
        }
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
  console.log(new Date(), 'realtime.js has started');
});
