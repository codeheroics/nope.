'use strict';

var NO_SUCH_KEY_CODE = 13;

var couchbase = require('couchbase');

var db = new couchbase.Connection({host: 'localhost:8091', bucket: 'default'});

var get = db.get.bind(db);
db.get = function() {
  var options, callback;
  if (typeof arguments[1] === 'function') {
    options = null;
    callback = arguments[1];
  } else {
    options = arguments[1];
    callback = arguments[2];
  }
  get(arguments[0], options, function(err, data) {
    if (err && err.code === NO_SUCH_KEY_CODE) return callback(null, null);
    callback(err, data);
  });

};

module.exports = db;
