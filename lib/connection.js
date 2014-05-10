'use strict';

var couchbase = require('couchbase');

var db = new couchbase.Connection({host: 'localhost:8091', bucket: 'default'});

module.exports = db;
