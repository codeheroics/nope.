'use strict';

var async = require('async');
var db = require('../lib/connection');

var User = function(params) {
  if (!params.name) throw new Error('No name');
  if (!params.email) throw new Error('No email');
  this.name = params.name;
  this.email = params.email.toLowerCase();
  this.friendsPokes = params.friendsPokes ? params.friendsPokes : {};
  this.bannedUsers = params.bannedUsers ? params.bannedUsers : {};
  this.score = params.score || 0;
  this.cas = params.cas || null;
};

User.findById = function(email, callback) {
  this.get(email.toLowerCase(), function(err, result) {
    if (err) return callback(err);
    if (!result || !result.value) return callback(null, null);
    result.value.cas = result.cas;
    callback(null, new User(result.value));
  });
};

User.prototype.save = function(callback) {
  if (!this.email) return callback(new Error('No mail'));

  var options = {};
  if (this.cas) {
    options.cas = this.cas;
  }

  db.set(this.email.toLowerCase(), this.toDbJSON(), options, callback);
};

User.prototype.toDbJSON = function() {
  return {
    name: this.name,
    friendsPokes: this.friendsPokes,
    score: this.score
  };
};

User.prototype.hasFriend = function(email) {
  return this.friendsPokes[email.toLowerCase()];
};

User.prototype.hasBanned = function(email) {
  return this.bannedUsers[email.toLowerCase()];
};

User.prototype.setPokingAt = function(email, opponentWonPoints) {
  var oldPoke = this.friendsPokes[email];
  this.friendsPokes[email] = {
    date: new Date(),
    myScore: oldPoke ? oldPoke.score : 0,
    opponentScore: oldPoke.score + opponentWonPoints,
    isPokingMe: false
  };
};

User.prototype.setPokedBy = function(email, wonPoints) {
  var oldPoke = this.friendsPokes[email];
  this.friendsPokes[email] = {
    date: new Date(),
    isPokingMe: true,
    myScore: oldPoke.myScore + wonPoints,
    opponentScore: oldPoke.opponentScore
  };
};

User.prototype.pokeAt = function(email, callback) {
  var self = this;
  User.findById(email, function(err, userPoked) {
    if (err) return callback(err);

    if (!userPoked.hasFriend(self.email)) {
      if (userPoked.hadBanned(self.email)) {
        return callback(new Error('Banned'));
      }
      return User.sendFriendRequest(email, callback);
    }

    if (self.friendsPokes[opponentUserPoke.email]) {
      self.friendsPokes[opponentUserPoke.email] = {};
    }
    var opponentUserPoke = userPoked.friendsPokes[self.email];
    var selfPoke = self.friendsPokes[opponentUserPoke.email];

    if (!opponentUserPoke) return callback(new Error('This should not happen'));
    if (opponentUserPoke.isPokingMe) return callback(new Error('This should not happen either'));

    // okay, we can poke

    var wonPoints = Math.round(Date.now() - selfPoke.date.getTime() / 1000);

    self.setPokingAt(email, wonPoints);
    userPoked.setPokedBy(email, wonPoints);

    async.parallel([
      function(cbParallel) { userPoked.save(cbParallel); },
      function(cbParallel) { self.save(cbParallel); }
    ], function(err) {
      if (err) return callback(err);

      // TODO EMIT AN EVENT
      console.log('should emit event');
      callback();
    });
  });
};

User.prototype.sendFriendRequest = function(email, callback) {

};

module.exports = User;
