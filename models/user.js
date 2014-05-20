'use strict';

var async       = require('async');
var validator   = require('validator');
var db          = require('../lib/connection');

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
  PENDING: 'Pending',
  FRIEND: 'Friend',
  NOT_FRIEND: 'Not Friend',
  SELF: 'SELF'
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
  if (!validator.isEmail(this.email)) return callback(new Error('Invalid email'));

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
  return this.friendsPokes[email.toLowerCase()] ? true : false;
};

User.prototype.hasBanned = function(email) {
  return this.bannedUsers[email.toLowerCase()] ? true : false;
};

User.prototype.hasPending = function(email) {
  return this.pendingUsers.indexOf(email) !== -1;
};

User.prototype.setPokingAt = function(email, date, opponentWonPoints) {
  email = email.toLowerCase();
  var oldPoke = this.friendsPokes[email];
  this.friendsPokes[email] = {
    date: date,
    myScore: oldPoke ? oldPoke.myScore : 0,
    opponentScore: oldPoke ? oldPoke.opponentScore + opponentWonPoints : 0,
    isPokingMe: false
  };
};

User.prototype.setPokedBy = function(email, date, wonPoints) {
  email = email.toLowerCase();
  var oldPoke = this.friendsPokes[email];
  this.friendsPokes[email] = {
    date: date,
    isPokingMe: true,
    myScore: oldPoke ? oldPoke.myScore + wonPoints : wonPoints,
    opponentScore: oldPoke ? oldPoke.opponentScore : 0
  };
};

User.prototype.pokeAt = function(opponentEmail, callback) {
  var self = this;
  User.findById(opponentEmail, function(err, userPoked) {
    if (err) return callback(err);
    if (!userPoked) return callback(null, User.FRIEND_STATUSES.NOT_FOUND);

    if (!userPoked.hasFriend(self.email)) {
      if (userPoked.hasBanned(self.email)) {
        return callback(null, User.FRIEND_STATUSES.BANNED);
      }
      if (userPoked.hasPending(self.email)) {
        return callback(null, User.FRIEND_STATUSES.PENDING);
      }
      return callback(null, User.FRIEND_STATUSES.NOT_FRIEND);
    }

    var opponentUserPoke = userPoked.friendsPokes[self.email];

    var isFirstPoke = self.friendsPokes[opponentEmail] ? false : true; // Very first poke
    if (!self.friendsPokes[opponentEmail]) {
      self.friendsPokes[opponentEmail] = {};
    }
    var selfPoke = self.friendsPokes[opponentEmail];

    if (!opponentUserPoke) return callback(new Error('This should not happen'));
    if (opponentUserPoke.isPokingMe) return callback(new Error('Already poked back'));

    // okay, we can poke

    var date = new Date();
    var time = date.getTime();
    var wonPoints = isFirstPoke ? 0 : Math.round((time - new Date(selfPoke.date).getTime()) / 1000);

    self.setPokingAt(opponentEmail, date, wonPoints);
    userPoked.setPokedBy(self.email, date, wonPoints);

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
  if (email === this.email) return callback(null, User.FRIEND_STATUSES.SELF);

  User.findById(email, function(err, potentialFriend) {
    if (err) return callback(err);

    if (!potentialFriend) return callback(null, User.FRIEND_STATUSES.NOT_FOUND);
    if (potentialFriend.bannedUsers.indexOf(currentUser.email) !== -1) {
      return callback(null, User.FRIEND_STATUSES.BANNED);
    }
    var friendsEmails = Object.keys(currentUser.friendsPokes);
    if (friendsEmails.indexOf(currentUser.email) !== -1) {
      // Already friends!
      return callback(null, User.FRIEND_STATUSES.FRIEND);
    }
    if (potentialFriend.hasPending(currentUser.email)) {
      return callback(null, User.FRIEND_STATUSES.PENDING);
    }

    currentUser.setPokingAt(potentialFriend.email, new Date(), 0);
    potentialFriend.pendingUsers.push(currentUser.email);
    console.log('should emit event to convey that a friend request was sent');

    async.parallel([
      function(cbParallel) { currentUser.save(cbParallel); },
      function(cbParallel) { potentialFriend.save(cbParallel); }
    ], function(err) {
      if (err) return callback(err);
      callback(null, User.FRIEND_STATUSES.PENDING);
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
