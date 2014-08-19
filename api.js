'use strict';
var express = require('express');
var app = express();

var config = require('config');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false })); // Forms
app.use(bodyParser.json());
// app.use(bodyParser.json({ type: 'application/vnd.api+json' }))

app.use(express.static(__dirname + '/public'));

var passport  = require('passport');
require('./lib/passport')(passport);
app.use(passport.initialize());

app.set('jwtTokenSecret', config.jwtTokenSecret);
app.set('jsonp callback name', 'nopecb');

// Routes & controller logic
require('./controllers/auth')(app, passport);
require('./controllers/pokes')(app);
require('./controllers/users')(app);

app.listen(8000);
