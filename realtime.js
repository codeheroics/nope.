'use strict';
var express = require('express');
var bodyParser = require('body-parser');

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
  spark.on('data', function received(data) {
    console.log(spark.id, 'received message:', data);
    spark.write(data);
  });
});

server.listen(8080, function () {
  console.log('Open http://localhost:8080 in your browser');
});
