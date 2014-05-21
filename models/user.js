'use strict';

var couchbase   = require('couchbase');
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
  this.created = params.created ? params.created : Date.now();
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
    created: this.created
  };
};

User.prototype.toPublicJSON = function() {
  return {
    name: this.name,
    friendsPokes: this.friendsPokes,
    score: this.score,
    created: this.created
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

User.prototype.setPokingAt = function(email, time, opponentWonPoints) {
  email = email.toLowerCase();
  var oldPoke = this.friendsPokes[email];
  this.friendsPokes[email] = {
    time: time,
    myScore: oldPoke ? oldPoke.myScore : 0,
    opponentScore: oldPoke ? oldPoke.opponentScore + opponentWonPoints : 0,
    isPokingMe: false
  };
};

User.prototype.setPokedBy = function(email, time, wonPoints) {
  email = email.toLowerCase();
  var oldPoke = this.friendsPokes[email];
  this.friendsPokes[email] = {
    time: time,
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

    if (!opponentUserPoke) return callback(new Error('This should not happen'));
    if (opponentUserPoke.isPokingMe) return callback(new Error('Already poked back'));

    // okay, we can poke

    var time = Date.now();
    var wonPoints;

    var isFirstPoke = self.friendsPokes[opponentEmail] ? false : true; // Very first poke

    if (isFirstPoke) {
      self.removeFromPendingUsers(opponentEmail);
      wonPoints = 0;
    } else {
      wonPoints = Math.round((time - self.friendsPokes[opponentEmail].time) / 1000);
    }

    // From here, this can be repeated in case of CAS error

    async.series(
      [
        function manageUserPoked(cbSeries) {
          async.retry(
            3,
            function updateUserPoked(cbRetry) {
              userPoked.setPokedBy(self.email, time, wonPoints);
              userPoked.save(function(errSave, result) {
                // There was an error saving due to the CAS : We'll update the object and retry saving
                if (errSave && errSave.code === couchbase.errors.keyAlreadyExists) {
                  User.findById(userPoked.email, function(errGet, updateUserPoked) {
                    if (errGet) return cbRetry(errGet);
                    userPoked = updateUserPoked;
                    return cbRetry(errSave);
                  });
                }
                // No error at save
                cbRetry();
              });
            },
            cbSeries
          );
        },

        function manageUserPoking(cbSeries) {
          async.retry(
            3,
            function updateUserPoking(cbRetry) {
              self.setPokingAt(opponentEmail, time, wonPoints);
              self.save(function(errSave, result) {
                // There was an error saving due to the CAS : We'll update the object and retry saving
                if (errSave && errSave.code === couchbase.errors.keyAlreadyExists) {
                  User.findById(self.email, function(errGet, pokingUser) {
                    if (errGet) return cbRetry(errGet);
                    self = pokingUser;
                    return cbRetry(errSave);
                  });
                }
                // No error at save
                cbRetry();
              });
            },
            cbSeries
          );
        }
      ],
      function(err) {
        if (err) return callback(err);

        // TODO EMIT AN EVENT
        console.log('should emit event to convey that an user was poked'); // TODO
        callback();
      }
    );
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

    currentUser.setPokingAt(potentialFriend.email, Date.now(), 0);
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
