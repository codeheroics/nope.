'use strict';
var express = require('express');
var app = express();

var config = require('config');
var bodyParser = require('body-parser');

var winston = require('winston');
winston.add(winston.transports.File, { filename: './log/api.log' });
if (process.env.NODE_ENV === 'production') winston.remove(winston.transports.Console);

app.use(bodyParser.urlencoded({ extended: false })); // Forms
app.use(bodyParser.json());
// app.use(bodyParser.json({ type: 'application/vnd.api+json' }))

app.use(express.static(__dirname + '/public_dist'));

var passport  = require('passport');
require('./lib/passport')(passport);
app.use(passport.initialize());

app.set('jwtTokenSecret', config.jwtTokenSecret);
app.set('jsonp callback name', 'nopecb');

// Routes & controller logic
app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/public_dist/app.html');
});
require('./controllers/auth')(app);
require('./controllers/nopes')(app);
require('./controllers/users')(app);

app.listen(8000);
console.log(new Date(), 'api.js has started');
