'use strict';
var redis = require('redis');
var client = redis.createClient();
var config = require('config');

// START - this mirrors the behaviour of primus-redis-rooms (rooms.js)
var uuid = require('node-uuid');
var id = uuid.v4();
var prefix = config.primusChannel + '.';
var channel = prefix + id;
// END - this mirrors the behaviour of primus-redis-rooms (rooms.js)


exports.publish = function(email, data) {
  return client.publish(
    channel,
    JSON.stringify({
      room: email,
      data: data
    })
  );
};

exports.subscribe = client.subscribe;
