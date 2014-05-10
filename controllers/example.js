var couchbase = require('couchbase');

var db = new couchbase.Connection({host: 'localhost:8091', bucket: 'default'});

db.get('Aaron0', function(err, res) {
  console.log(err);
  console.log(res);
})

console.log('ici');
