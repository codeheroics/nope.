'use strict';

var async = require('async');
var db = require('../lib/connection');

var User = function(params) {
  if (!params) throw new Error('Missing properties');
  if (!params.name) throw new Error('No name');
  if (!params.email) throw new Error('No email');
  this.name = params.name;
  this.email = params.email.toLowerCase();
  this.password = params.password;
  this.friendsPokes = params.friendsPokes ? params.friendsPokes : {};
  this.bannedUsers = params.bannedUsers ? params.bannedUsers : [];
  this.pendingUsers = params.pendingUsers ? params.pendingUsers : [];
  this.score = params.score || 0;
  this.date = params.date ? params.date : new Date();
  this.cas = params.cas || null;
};

User.FRIEND_STATUSES = {
  BANNED: 'Banned',
  NOT_FOUND: 'Not found',
  PENDING: 'Pending'
};

User.findById = function(email, callback) {
  email = email.toLowerCase();
  db.get(email, function(err, result) {
    if (err) return callback(err);
    if (!result || !result.value) return callback(null, null);
    result.value.cas = result.cas;
    result.value.email = email;
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
    password: this.password,
    friendsPokes: this.friendsPokes,
    bannedUsers: this.bannedUsers,
    pendingUsers: this.pendingUsers,
    score: this.score,
    date: this.date
  };
};

User.prototype.toPublicJSON = function() {
  return {
    name: this.name,
    friendsPokes: this.friendsPokes,
    score: this.score,
    date: this.date
  };
};

User.prototype.hasFriend = function(email) {
  return this.friendsPokes[email.toLowerCase()];
};

User.prototype.hasBanned = function(email) {
  return this.bannedUsers[email.toLowerCase()];
};

User.prototype.setPokingAt = function(email, opponentWonPoints) {
  email = email.toLowerCase();
  var oldPoke = this.friendsPokes[email];
  this.friendsPokes[email] = {
    date: new Date(),
    myScore: oldPoke ? oldPoke.score : 0,
    opponentScore: oldPoke.score + opponentWonPoints,
    isPokingMe: false
  };
};

User.prototype.setPokedBy = function(email, wonPoints) {
  email = email.toLowerCase();
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
      console.log('should emit event to convey that an user was poked'); // TODO
      callback();
    });
  });
};

User.prototype.sendFriendRequest = function(email, callback) {
  var currentUser = this;
  email = email.toLowerCase();
  User.findById(email, function(err, potentialFriend) {
    if (err) return callback(err);

    if (!potentialFriend) return callback(null, User.FRIEND_STATUSES.NOT_FOUND);
    if (potentialFriend.bannedUsers.indexOf(currentUser.email) !== -1) {
      return callback(null, User.FRIEND_STATUSES.BANNED);
    }

    currentUser.setPokingAt(potentialFriend);
    potentialFriend.pendingUsers.push(currentUser.email);
    console.log('should emit event to convey that a friend request was sent');

    async.parallel([
      function(cbParallel) { currentUser.save(cbParallel); },
      function(cbParallel) { potentialFriend.save(cbParallel); }
    ], function(err) {
      if (err) return callback(err);
      callback(null, User.FRIEND_STATUSES);
    });
  });
};

User.prototype.removeFromPendingUsers = function(email) {
  email = email.toLowerCase();
  this.pendingUsers = this.pendingUsers.filter(function(userEmail) {
    return userEmail !== email;
  });
};

User.prototype.rejectFriendRequest = function(email) {
  email = email.toLowerCase();
  this.removeFromPendingUsers(email);
  this.bannedUsers.push(email);
};

User.prototype.unban = function(email) {
  email = email.toLowerCase();
  this.bannedUsers = this.bannedUsers.filter(function(bannedEmail) {
    return bannedEmail !== email;
  });
};

module.exports = User;
