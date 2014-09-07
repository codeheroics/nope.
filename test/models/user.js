/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/
'use strict';

var async   = require('async');
var expect  = require('chai').expect;
var User    = require('../../models/user');

describe('User', function() {
  beforeEach(function(done) {
    var userA = new User({name: 'A', email: 'a@a.a'});
    var userB = new User({name: 'B', email: 'b@b.b'});

    async.series([
      function(cbSeries) {
        userA.save(cbSeries); },
      function(cbSeries) {
        userB.sendFriendRequest(userA.email, cbSeries);
      }
    ], done);
  });

  describe('#nopeAt', function() {
    it('should retry saving if the save produces a CAS error', function(done) {
      async.parallel({
        a: function(cbParallel) { User.findById('a@a.a', cbParallel); },
        b: function(cbParallel) { User.findById('b@b.b', cbParallel); }
      }, function(err, results) {
        expect(err).to.not.exist;

        var userA = results.a;
        var userB = results.b;

        expect(userA).to.exist;
        expect(userB).to.exist;

        userA.nopeAt(userB.email, function(err, status) {
          expect(err).to.not.exist;
          expect(status).to.not.exist;

          // The userB that we have in memory is not up to date anymore
          // Saving should send back an error, but noping should
          // do the necessary to circuvent that
          async.series([
            function(cbSeries) {
              userB.save(function(err) {
                expect(err).to.exist;
                cbSeries();
              });
            },
            function(cbSeries) {
              userB.nopeAt(userA.email, function(err) {
                expect(err).to.not.exist;
                cbSeries();
              });
            }
          ], done);
        });
      });
    });
  });
});
