'use strict';

var couchbase   = require('couchbase');
var async       = require('async');
var validator   = require('validator');
var db          = require('../lib/couchbase');
var redisClient = require('../lib/redisClient');
var _           = require('lodash');

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
    return ignoredUser.email === email;
  });
};

User.prototype.hasInvited = function(email) {
  return this.invitedUsers.some(function(invitedUser) {
    return invitedUser.email === email;
  });
};

User.prototype.hasPending = function(email) {
  return this.pendingUsers.some(function(pendingUser) {
    return pendingUser.email === email;
  });
};

/**
 * [setPokingAt description]
 * @param {User} userPoked    user poked
 * @param {[type]} time              [description]
 * @param {[type]} opponentWonPoints [description]
 */
User.prototype.setPokingAt = function(userPoked, time, opponentWonPoints) {
  if (isNaN(oldPoke ? oldPoke.opponentScore + opponentWonPoints : 0) || isNaN(oldPoke ? oldPoke.myScore + 1 : 0)) {
    console.log('setPokingAt NaN!', time, userPoked, opponentWonPoints); // FOR DEBUGGING if problem
  }
  var email = userPoked.email;
  email = email.toLowerCase().trim();
  var oldPoke = this.friendsPokes[email] || {};
  this.friendsPokes[email] = {
    time: time,
    myScore: (oldPoke.myScore || 0) + 1, // Increment + 1, I poked
    opponentScore: (oldPoke.opponentScore || 0) + (opponentWonPoints || 0),
    points: opponentWonPoints || 0,
    pokesCpt: (oldPoke.pokesCpt || 0) + 1,
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
  if (isNaN(oldPoke ? oldPoke.opponentScore + wonPoints : 0) || isNaN(oldPoke ? oldPoke.opponentScore + 1 : 0)) {
    console.log('setPokedBy NaN!', time, userPoking, wonPoints); // FOR DEBUGGING if problem
  }
  var email = userPoking.email;
  var oldPoke = this.friendsPokes[email] || {};
  this.friendsPokes[email] = {
    time: time,
    isPokingMe: true,
    myScore: (oldPoke.myScore || 0) + (wonPoints || 0),
    points: wonPoints || 0,
    pokesCpt: oldPoke.pokesCpt || 0,
    opponentScore: (oldPoke.opponentScore || 0) + 1, // Increment + 1, he poked
    opponentName: userPoking.name.trim()
  };
};

User.prototype.pokeAt = function(opponentEmail, callback) {
  var self = this;
  User.findById(opponentEmail, function(err, userPoked) {
    if (err) return callback(err);
    if (!userPoked) return callback(null, User.FRIEND_STATUSES.NOT_FOUND);

    if (!userPoked.hasFriend(self.email)) {
      if (userPoked.hasIgnored(self.email)) { // FIXME this won't do, if a user had a friend then suddenly he's pending, it's weird
        return callback(new FriendError(User.FRIEND_STATUSES.PENDING)); // Do not tell a user he's been ignored
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
    var wonPoints = 0;
    if (self.friendsPokes[opponentEmail] && self.friendsPokes[opponentEmail].time) {
      // 1 point per poke + 1 point per hour
      var oneHour = 1000 * 60 * 60;
      wonPoints = Math.floor((time - self.friendsPokes[opponentEmail].time) / oneHour);
      if (isNaN(wonPoints)) console.log('NaN!', time, self, userPoked); // FOR DEBUGGING if problem
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
        if (err) return callback(err);


        function formatPokeDataForPrimus(pokeData, email) {
          pokeData.email = email;
          return pokeData;
        }

        redisClient.publish(
          self.email,
          formatPokeDataForPrimus(
            self.friendsPokes[opponentEmail],
            opponentEmail
          )
        );
        redisClient.publish(
          opponentEmail,
          formatPokeDataForPrimus(
            userPoked.friendsPokes[self.email],
            self.email
          )
        );
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
    return callback(null, User.FRIEND_STATUSES.PENDING);
  }

  if (this.hasFriend(email)) {
    // Already friends
    return callback(null, User.FRIEND_STATUSES.FRIEND);
  }

  if (this.hasIgnored(email)) {
    // Restore ignored user // FIXME move in restoreIgnoredUser method
    return callback(null, User.FRIEND_STATUSES.IGNORED);
  }

  User.findById(email, function(err, potentialFriend) {
    if (err) return callback(err);

    if (!potentialFriend) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FOUND));
     // Do not tell a user he's been ignored
    if (potentialFriend.hasIgnored(currentUser.email)) return callback(null, User.FRIEND_STATUSES.PENDING);

    // FIXME TODO Thing about separating all that in 2 methods (sendFriendRequest, acceptFriendRequest)

    var callbackStatus;

    if (potentialFriend.hasFriend(currentUser.email) || potentialFriend.hasIgnored(currentUser.email)) {
      // The users already knew each other,
      callbackStatus = User.FRIEND_STATUSES.FRIEND; // Opponent will be poked & notified
    } else if (potentialFriend.hasInvited(currentUser.email)) {
      // Become friends !
      potentialFriend.removeFromInvitedUsers(currentUser.email);
      currentUser.removeFromPendingUsers(potentialFriend.email);
      potentialFriend.friendsPokes[currentUser.email] = {}; // Sets them as friends
      currentUser.friendsPokes[potentialFriend.email] = {}; // Sets them as friends
      callbackStatus = User.FRIEND_STATUSES.FRIEND; // Opponent will be poked & notified, OK.
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
      redisClient.publish(
        potentialFriend.email,
        {
          pendingUser: {
            email: currentUser.email,
            opponentName: currentUser.name
          }
        }
      );
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

User.prototype._removeFromUsers = function(arrayName, email) {
  var removedUser = null;
  this[arrayName] = this[arrayName].filter(function(user) {
    if (user.email !== email) return true;
    removedUser = user;
    return false;
  });
  return removedUser;
};

User.prototype.removeFromPendingUsers = function(email) {
  return this._removeFromUsers('pendingUsers', email);
};

User.prototype.removeFromIgnoredUsers = function(email) {
  return this._removeFromUsers('ignoredUsers', email);
};

User.prototype.ignoreUser = function(email, callback) {
  var self = this;
  email = email.toLowerCase();

  if (self.hasIgnored(email)) { // already ignored
    return callback();
  }

  User.findById(email, function(err, ignoredUser) {
    if (err) return callback(err);
    if (!ignoredUser) return callback(new Error(User.FRIEND_STATUSES.NOT_FOUND));

    var ignoredUserData;
    if (self.hasFriend(ignoredUser.email)) {
      // Save the most data possible
      ignoredUserData = _.clone(self.friendsPokes[ignoredUser.email]);
      ignoredUserData.email = ignoredUser.email;
      delete self.friendsPokes[ignoredUser.email];
    } else {
      if (self.hasPending(ignoredUser.email)) {
        self.removeFromPendingUsers(ignoredUser.email);
      }
      ignoredUserData = {
        email: ignoredUser.email,
        opponentName: ignoredUser.name
      };
    }
    self.ignoredUsers.push(ignoredUserData);

    redisClient.publish(
      self.email,
      { ignoredUser: _.pick(ignoredUserData, ['email', 'opponentName']) }
    );

    self.save(callback);
  });
};

User.prototype.unIgnoreUser = function(email, callback) {
  email = email.toLowerCase();

  var restoredUser = this.removeFromIgnoredUsers(email);
  if (!restoredUser) return callback(); // Was not ignored
  this.friendsPokes[restoredUser.email] = restoredUser;
  delete this.friendsPokes[restoredUser.email].email; // Data just added for save in ignored users
  this.save(callback);
};

module.exports = User;
