'use strict';

var couchbase   = require('couchbase');
var async       = require('async');
var validator   = require('validator');
var db          = require('../lib/connection').db;

var User = function(params) {
  if (!params) throw new Error('Missing properties');
  if (!params.name) throw new Error('No name');
  if (!params.email) throw new Error('No email');
  this.name = params.name;
  this.email = params.email.toLowerCase();
  this.password = params.password;
  this.friendsPokes = params.friendsPokes ? params.friendsPokes : {};
  this.invitedUsers = params.invitedUsers ? params.invitedUsers : [];
  this.ignoredUsers = params.ignoredUsers ? params.ignoredUsers : [];
  this.pendingUsers = params.pendingUsers ? params.pendingUsers : [];
  this.score = params.score || 0;
  this.totalPokes = params.totalPokes || 0;
  this.created = params.created ? params.created : Date.now();
  this.cas = params.cas || null;
};

User.FRIEND_STATUSES = {
  IGNORED: 'Ignored',
  NOT_FOUND: 'Not found',
  PENDING: 'Pending',
  INVITED: 'Invited',
  FRIEND: 'Friend',
  NOT_FRIEND: 'Not Friend',
  SELF: 'Self',
  UNKNOWN: 'Unknown'
};

var FriendError = User.FriendError = function(status) {
  this.name = 'FriendError';
  this.message = 'There was an error due to the user status: ' + status;
  this.status = status;
};
User.FriendError.prototype = new Error();

var PokeError = User.PokeError = function(message) {
  this.name = 'PokeError';
  this.message = 'There was an error while poking: ' + message;
};
User.PokeError.prototype = new Error();

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
    invitedUsers: this.invitedUsers,
    ignoredUsers: this.ignoredUsers,
    pendingUsers: this.pendingUsers,
    score: this.score,
    totalPokes: this.totalPokes,
    created: this.created
  };
};

User.prototype.toSelfJSON = function() {
  return {
    name: this.name,
    email: this.email,
    created: this.created,
    score: this.score,
    totalPokes: this.totalPokes,
    invitedUsers: this.invitedUsers,
    ignoredUsers: this.ignoredUsers,
    pendingUsers: this.pendingUsers
  };
};

User.prototype.toPublicJSON = function() {
  return {
    name: this.name,
    score: this.score,
    totalPokes: this.totalPokes,
    created: this.created
  };
};

User.prototype.hasFriend = function(email) {
  return this.friendsPokes[email.toLowerCase()] ? true : false;
};

User.prototype.hasIgnored = function(email) {
  return this.ignoredUsers.some(function(ignoredUser) {
    return ignoredUser.email !== -1;
  });
};

User.prototype.hasInvited = function(email) {
  return this.invitedUsers.some(function(invitedUser) {
    return invitedUser.email !== -1;
  });
};

User.prototype.hasPending = function(email) {
  return this.pendingUsers.some(function(pendingUser) {
    return pendingUser.email !== -1;
  });
};

/**
 * [setPokingAt description]
 * @param {User} userPoked    user poked
 * @param {[type]} time              [description]
 * @param {[type]} opponentWonPoints [description]
 */
User.prototype.setPokingAt = function(userPoked, time, opponentWonPoints) {
  var email = userPoked.email;
  email = email.toLowerCase().trim();
  var oldPoke = this.friendsPokes[email];
  this.friendsPokes[email] = {
    time: time,
    myScore: oldPoke ? oldPoke.myScore : 0,
    opponentScore: oldPoke ? oldPoke.opponentScore + opponentWonPoints : 0,
    points: opponentWonPoints || 0,
    pokesCpt: oldPoke ? ++oldPoke.pokesCpt : 0,
    isPokingMe: false,
    opponentName: userPoked.name.trim()
  };
};

/**
 * [setPokedBy description]
 * @param {User} userPoking    user poking
 * @param {[type]} time       [description]
 * @param {[type]} wonPoints  [description]
 */
User.prototype.setPokedBy = function(userPoking, time, wonPoints) {
  var email = userPoking.email;
  var oldPoke = this.friendsPokes[email];
  this.friendsPokes[email] = {
    time: time,
    isPokingMe: true,
    myScore: oldPoke ? oldPoke.myScore + wonPoints : wonPoints,
    points: wonPoints || 0,
    pokesCpt: oldPoke.pokesCpt || 0,
    opponentScore: oldPoke ? oldPoke.opponentScore : 0,
    opponentName: userPoking.name.trim()
  };
};

User.prototype.pokeAt = function(opponentEmail, callback) {
  var self = this;
  User.findById(opponentEmail, function(err, userPoked) {
    if (err) return callback(err);
    if (!userPoked) return callback(null, User.FRIEND_STATUSES.NOT_FOUND);

    if (!userPoked.hasFriend(self.email)) {
      if (userPoked.hasIgnored(self.email)) {
        return callback(new FriendError(User.FRIEND_STATUSES.IGNORED));
      }
      if (userPoked.hasPending(self.email)) {
        return callback(new FriendError(User.FRIEND_STATUSES.PENDING));
      }
      return callback(new FriendError(User.FRIEND_STATUSES.NOT_FRIEND));
    }

    var opponentUserPoke = userPoked.friendsPokes[self.email];

    if (!opponentUserPoke) return callback(new Error('This should not happen'));
    if (opponentUserPoke.isPokingMe) return callback(new PokeError('Already poked back'));

    // okay, we can poke

    var time = Date.now();
    var wonPoints;

    var isFirstPoke = self.friendsPokes[opponentEmail] ? false : true; // Very first poke

    if (isFirstPoke) {
      wonPoints = 1;
    } else {
      // 1 point per poke + 1 point per hour
      var oneHour = 1000 * 60 * 60;
      wonPoints = Math.floor((time - self.friendsPokes[opponentEmail].time) / oneHour) + 1;
    }

    // From here, this can be repeated in case of CAS error

    async.series(
      [
        function manageUserPoked(cbSeries) {
          async.retry(
            3,
            function updateUserPoked(cbRetry) {
              userPoked.setPokedBy(self, time, wonPoints);
              userPoked.score += wonPoints;
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
              self.setPokingAt(userPoked, time, wonPoints);
              self.totalPokes++;
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
        callback(err, self.friendsPokes[opponentEmail]);
      }
    );
  });
};

User.prototype.sendFriendRequest = function(email, callback) {
  var currentUser = this;
  email = email.toLowerCase();
  if (email === this.email) return callback(new FriendError(User.FRIEND_STATUSES.SELF));

  if (this.hasInvited(email)) {
    // Already invited that user
    return callback(new FriendError(User.FRIEND_STATUSES.PENDING));
  }

  User.findById(email, function(err, potentialFriend) {
    if (err) return callback(err);

    if (!potentialFriend) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FOUND));
    var friendsEmails = Object.keys(currentUser.friendsPokes);
    if (friendsEmails.indexOf(currentUser.email) !== -1) {
      // Already friends!
      return callback(null, User.FRIEND_STATUSES.FRIEND);
    }

    // FIXME TODO Thing about separating all that in 2 methods (sendFriendRequest, acceptFriendRequest)

    var callbackStatus;

    if (potentialFriend.hasInvited(currentUser.email)) {
      // Become friends !
      potentialFriend.removeFromInvitedUsers(currentUser.email);
      currentUser.removeFromPendingUsers(potentialFriend.email);
      potentialFriend.friendsPokes[currentUser.email] = {}; // Sets them as friends
      currentUser.friendsPokes[potentialFriend.email] = {}; // Sets them as friends
      var now = Date.now();
      callbackStatus = User.FRIEND_STATUSES.FRIEND;
      console.log('should emit event to convey that a friend request was accepted');
    } else {
      // Send friend request
      currentUser.invitedUsers.push({
        email: potentialFriend.email,
        name: potentialFriend.name
      });
      potentialFriend.pendingUsers.push({
        email: currentUser.email,
        name: currentUser.name
      });
      callbackStatus = User.FRIEND_STATUSES.PENDING;
      console.log('should emit event to convey that a friend request was sent');
    }

    async.parallel([
      function(cbParallel) { currentUser.save(cbParallel); },
      function(cbParallel) { potentialFriend.save(cbParallel); }
    ], function(err) {
      if (err) return callback(err);

      if (callbackStatus === User.FRIEND_STATUSES.PENDING) {
        return callback(null, callbackStatus);
      }
      currentUser.pokeAt(potentialFriend.email, function(err) {
        return callback(err, callbackStatus);
      });
    });
  });
};

User.prototype.removeFromPendingUsers = function(email) {
  email = email.toLowerCase();
  this.pendingUsers = this.pendingUsers.filter(function(pendingUser) {
    return pendingUser.email !== email;
  });
};

User.prototype.removeFromInvitedUsers = function(email) {
  email = email.toLowerCase();
  this.invitedUsers = this.invitedUsers.filter(function(invitedUser) {
    return invitedUser.email !== email;
  });
};

User.prototype.rejectFriendRequest = function(email, callback) {
  email = email.toLowerCase();

  User.findById(email, function(err, rejectedUser) {
    if (err) return callback(err);
    this.removeFromPendingUsers(email);
    this.ignoredUsers.push({
      name: rejectedUser.name,
      email: rejectedUser.email
    });
  });
};

User.prototype.unIgnore = function(email) {
  email = email.toLowerCase();
  this.ignoredUsers = this.ignoredUsers.filter(function(ignoredEmail) {
    return ignoredEmail !== email;
  });
};

module.exports = User;
