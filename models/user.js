'use strict';

var couchbase   = require('couchbase');
var async       = require('async');
var validator   = require('validator');
var winston     = require('winston');
var sanitizer   = require('sanitizer');
var _           = require('lodash');
var config      = require('config');

var db          = require('../lib/couchbase');
var redisClient = require('../lib/redisClient');
var userAchievements = require('./userAchievements');

var User = function(params) {
  if (!params) throw new Error('Missing properties');
  if (!params.name) throw new Error('No name');
  if (!params.email) throw new Error('No email');
  this.name = params.name.trim();
  this.email = params.email.toLowerCase().trim();
  this.password = params.password;
  this.passwordReset = params.passwordReset ? params.passwordReset : {};
  this.confirmed = !! params.confirmed || !config.requireUserConfirmation;
  this.friendsNopes = params.friendsNopes ? params.friendsNopes : {};
  this.invitedUsers = params.invitedUsers ? params.invitedUsers : [];
  this.ignoredUsers = params.ignoredUsers ? params.ignoredUsers : [];
  this.pendingUsers = params.pendingUsers ? params.pendingUsers : [];
  this.achievements = params.achievements ? params.achievements : {};
  this.timeNoping = params.timeNoping || 0;
  this.totalNopes = params.totalNopes || 0;
  this.created = params.created ? params.created : Date.now();
  this.cas = params.cas || null;
};

User.FRIEND_STATUSES = {
  IGNORED: 'Ignored',
  NOT_FOUND: 'Not found',
  PENDING: 'Pending',
  INVITED: 'Invited',
  FRIEND: 'Friend',
  IN_TRUCE: 'Truce',
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

var NopeError = User.NopeError = function(message) {
  this.name = 'NopeError';
  this.message = 'There was an error while noping: ' + message;
};
User.NopeError.prototype = new Error();

User.findById = function(email, callback) {
  email = email.toLowerCase().trim();
  db.get(email, function(err, result) {
    if (err) return callback(err);
    if (!result || !result.value) return callback(null, null);
    result.value.cas = result.cas;
    result.value.email = email;
    callback(null, new User(result.value));
  });
};

User.prototype.save = function(callback) {
  this.email = this.email.toLowerCase().trim();
  if (!validator.isEmail(this.email)) return callback(new Error('Invalid email'));
  this.name = sanitizer.sanitize(this.name).trim();
  if (!this.name.length) return callback(new Error('Invalid name'));

  var options = {};
  if (this.cas) {
    options.cas = this.cas;
  }

  db.set(this.email, this.toDbJSON(), options, callback);
};

User.prototype.toDbJSON = function() {
  return {
    name: this.name,
    password: this.password,
    passwordReset: this.passwordReset,
    confirmed: this.confirmed,
    friendsNopes: this.friendsNopes,
    invitedUsers: this.invitedUsers,
    ignoredUsers: this.ignoredUsers,
    pendingUsers: this.pendingUsers,
    timeNoping: this.timeNoping,
    totalNopes: this.totalNopes,
    created: this.created,
    achievements: this.achievements
  };
};

User.prototype.toSelfJSON = function() {
  return {
    name: this.name,
    email: this.email,
    created: this.created,
    timeNoping: this.timeNoping,
    totalNopes: this.totalNopes,
    invitedUsers: this.invitedUsers,
    ignoredUsers: this.ignoredUsers,
    pendingUsers: this.pendingUsers,
    achievements: this.achievements
  };
};

User.prototype.toPublicJSON = function() {
  return {
    name: this.name,
    timeNoping: this.timeNoping,
    totalNopes: this.totalNopes,
    created: this.created,
    achievements: this.achievements
  };
};

User.prototype.hasFriend = function(email) {
  return this.friendsNopes[email] ? true : false;
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

User.prototype.inTruce = function(email) {
  if (!this.friendsNopes[email]) return false;
  if (!this.friendsNopes[email].truce) return false;
  if (this.friendsNopes[email].truce.endTime > Date.now()) return true;
  return this.friendsNopes[email].time > this.friendsNopes[email].truce.endTime;
};

/**
 * [setNopingAt description]
 * @param {User} userNoped    user noped
 * @param {[type]} time              [description]
 * @param {[type]} timeDiff [description]
 */
User.prototype.setNopingAt = function(userNoped, now, timeDiff) {
  var oldNope = this.friendsNopes[userNoped.email] || {};
  this.friendsNopes[userNoped.email] = {
    time: now,
    myTimeNoping: (oldNope.myTimeNoping || 0),
    opponentTimeNoping: (oldNope.opponentTimeNoping || 0) + (timeDiff || 0),
    timeDiff: timeDiff || 0,
    nopesCpt: (oldNope.nopesCpt || 0) + 1,
    isNopingMe: false,
    opponentName: userNoped.name
  };
};

/**
 * [setNopedBy description]
 * @param {User} userNoping    user noping
 * @param {[type]} now       [description]
 * @param {[type]} timeDiff  [description]
 */
User.prototype.setNopedBy = function(userNoping, now, timeDiff) {
  var email = userNoping.email;
  var oldNope = this.friendsNopes[email] || {};
  this.friendsNopes[email] = {
    time: now,
    isNopingMe: true,
    myTimeNoping: (oldNope.myTimeNoping || 0) + (timeDiff || 0),
    timeDiff: timeDiff || 0,
    nopesCpt: oldNope.nopesCpt || 0,
    opponentTimeNoping: (oldNope.opponentTimeNoping || 0),
    opponentName: userNoping.name
  };
};

User.prototype.nopeAt = function(opponentEmail, callback) {
  var self = this;
  var now = Date.now();

  opponentEmail = opponentEmail.toLowerCase().trim();

  if (!this.hasFriend(opponentEmail)) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FRIEND));
  if (this.inTruce(opponentEmail)) return callback(new FriendError(User.FRIEND_STATUSES.IN_TRUCE));

  // === false because undefined would mean it is not defined yet (user just added has friend)
  // we send back the data, maybe the user did not get it before
  if (this.friendsNopes[opponentEmail].isNopingMe === false) return callback(null, this.friendsNopes[opponentEmail]);

  User.findById(opponentEmail, function(err, userNoped) {
    if (err) return callback(err);
    if (!userNoped) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FOUND));

    if (!userNoped.hasFriend(self.email)) {
      if (userNoped.hasIgnored(self.email)) {
        return self.nopeAtUserIgnoringMe(userNoped, now, callback);
      }
      if (userNoped.hasPending(self.email)) {
        return callback(new FriendError(User.FRIEND_STATUSES.PENDING));
      }
      return callback(new FriendError(User.FRIEND_STATUSES.NOT_FRIEND));
    }

    var opponentUserNope = userNoped.friendsNopes[self.email];

    if (!opponentUserNope) return callback(new Error('This should not happen'));
    // Next line not useful, check already done ahead, but be careful of locks
    // if (opponentUserNope.isNopingMe) return callback(new NopeError('Already noped back'));

    // okay, we can nope

    var timeDiff = (now - self.friendsNopes[opponentEmail].time) || 0;
    // From here, this can be repeated in case of CAS error

    // TODO be careful, even with this, we could be getting cases of locks
    // (both users with friendsNopes[email].isNopingMe to false)

    // TODO look if couchbase has notions of rollbacks

    async.series(
      [
        function manageUserNoped(cbSeries) {
          async.retry(
            3,
            function updateUserNoped(cbRetry) {
              userNoped.setNopedBy(self, now, timeDiff);
              userNoped.timeNoping += timeDiff;
              userNoped.save(function(errSave, result) {
                // There was an error saving due to the CAS : We'll update the object and retry saving
                if (errSave && errSave.code === couchbase.errors.keyAlreadyExists) {
                  winston.warn('Got CAS error for ' + userNoped.email + ', should be ok after retry');
                  User.findById(userNoped.email, function(errGet, updateUserNoped) {
                    if (errGet) return cbRetry(errGet);
                    userNoped = updateUserNoped;
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

        function manageUserNoping(cbSeries) {
          async.retry(
            3,
            function updateUserNoping(cbRetry) {
              self.setNopingAt(userNoped, now, timeDiff);
              self.totalNopes++;
              self.earnAchievementsAfterNoping(self.friendsNopes[opponentEmail]);
              self.save(function(errSave, result) {
                // There was an error saving due to the CAS : We'll update the object and retry saving
                if (errSave && errSave.code === couchbase.errors.keyAlreadyExists) {
                  winston.warn('Got CAS error for ' + self.email  + ', should be ok after retry');
                  User.findById(self.email, function(errGet, nopingUser) {
                    if (errGet) return cbRetry(errGet);
                    self = nopingUser;
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
        if (err) {
          winston.error('Got error while saving a poke from ' + self.email  + ' to ' + userNoped.email, err);
          return callback(err);
        }

        redisClient.publish(
          self.email,
          formatNopeDataForPrimus(
            self.friendsNopes[opponentEmail],
            opponentEmail
          )
        );
        redisClient.publish(
          opponentEmail,
          formatNopeDataForPrimus(
            userNoped.friendsNopes[self.email],
            self.email
          )
        );
        callback(err, self.friendsNopes[opponentEmail]);
      }
    );
  });
};

User.prototype.nopeAtUserIgnoringMe = function(userIgnoring, now, callback) {
  var timeDiff = now - this.friendsNopes[userIgnoring.email].time;
  this.setNopingAt(userIgnoring, now, timeDiff);
  this.totalNopes++;

  var ignoringUserFriendsNopeForMe = userIgnoring.getIgnoredUserNopeInfos(this.email);
  // Equivalent of calling setNopedBy for ignored user
  ignoringUserFriendsNopeForMe.time = now;
  ignoringUserFriendsNopeForMe.isNopingMe = true;
  ignoringUserFriendsNopeForMe.myTimeNoping = (ignoringUserFriendsNopeForMe.myTimeNoping || 0) + (timeDiff || 0);
  ignoringUserFriendsNopeForMe.timeDiff = timeDiff || 0;
  ignoringUserFriendsNopeForMe.nopesCpt = ignoringUserFriendsNopeForMe.nopesCpt || 0;
  ignoringUserFriendsNopeForMe.opponentTimeNoping = (ignoringUserFriendsNopeForMe.opponentTimeNoping || 0) + 1, // Increment + 1, he nope;
  ignoringUserFriendsNopeForMe.opponentName = this.name;
  ignoringUserFriendsNopeForMe.email = ignoringUserFriendsNopeForMe.email;

  this.save(function(err) {
    if (err) return callback(err);
    userIgnoring.save(function(err) {
      if (err) return callback(err);

      redisClient.publish(
        this.email,
        formatNopeDataForPrimus(
          this.friendsNopes[userIgnoring.email],
          userIgnoring.email
        )
      );

      callback(null, this.friendsNopes[userIgnoring.email]);
    }.bind(this));
  }.bind(this));
};

User.prototype.concedeAgainst = function(email, callback) {
  if (!this.hasFriend(email)) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FRIEND));
  if (this.friendsNopes[email].myTimeNoping > this.friendsNopes[email].opponentTimeNoping) {
    return callback(new Error('not losing')); // FIXME what should this return so we can send "wtf" to the user
  }

  User.findById(email, function(err, opponent) {
    if (err) return callback(err);
    if (!opponent) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FOUND));
    if (!opponent.hasFriend(this.email)) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FRIEND));

    var now = Date.now();
    this.defeats++;
    this.friendsNopes[email].defeats++;
    this.friendsNopes[email].myTimeNoping = 0;
    this.friendsNopes[email].opponentTimeNoping = 0;
    this.friendsNopes[email].time = now;
    this.friendsNopes[email].timeDiff = 0;
    this.friendsNopes[email].isNopingMe = false;
    opponent.victories++;
    opponent.friendsNopes[this.email].victories++;
    opponent.friendsNopes[this.email].opponentTimeNoping = 0;
    opponent.friendsNopes[this.email].opponentTimeNoping = 0;
    opponent.friendsNopes[this.email].time = now;
    opponent.friendsNopes[this.email].timeDiff = 0;
    opponent.friendsNopes[this.email].isNopingMe = true;

    async.series([ // FIXME rollback etc
      opponent.save.bind(opponent),
      this.save.bind(this),
    ], function(err) {
      if (err) return callback(err);
      // FIXME handle CAS error

      redisClient.publish(
        this.email,
        {
          victory: false,
          nopeData: this.friendsNopes[email],
          opponentEmail: email
        }
      );
      redisClient.publish(
        email,
        {
          victory: true,
          totalVictories: this.victories,
          nopeData: opponent.friendsNopes[this.email],
          opponentEmail: this.email
        }
      );

      callback(null, this.friendsNopes[email]);
    }.bind(this));
  }.bind(this));
};

User.prototype.requestTruce = function(email, callback) {
  if (!this.hasFriend(email)) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FRIEND));
  if (this.inTruce(email)) return callback(new FriendError(User.FRIEND_STATUSES.IN_TRUCE));

  var now = Date.now();
  var anHourTime = 60 * 60 * 1000;
  var anHourAgoTime = now  - anHourTime;
  var anHourFromNowTime = now  + anHourTime;
  if (this.friendsNopes[email].truce && this.friendsNopes[email].truce.endTime && this.friendsNopes[email].truce.endTime > now) {
    // Already in truce
    return callback(null, this.friendsNopes[email]);
  }

  User.findById(email, function(err, opponent) {
    if (err) return callback(err);
    if (!opponent) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FOUND));
    if (!opponent.hasFriend(this.email)) return callback(null, this.friendsNopes[email]); // has ignored

    var myNopesInfos = this.friendsNopes[email];
    var opponentNopesInfos = opponent.friendsNopes[this.email];
    var isAcceptingRequest = false;

    if (!myNopesInfos.truce) myNopesInfos.truce = {};
    if (!opponentNopesInfos.truce) opponentNopesInfos.truce = {};

    if (myNopesInfos.truce.opponentRequest && myNopesInfos.truce.opponentRequest > anHourAgoTime) {
      // accept truce since there was a request less than an hour ago
      isAcceptingRequest = true;
      delete myNopesInfos.truce.opponentRequest;
      delete opponentNopesInfos.truce.myRequest;

      myNopesInfos.truce.endTime = anHourFromNowTime;
      myNopesInfos.truce.startTime = now;
      opponentNopesInfos.truce.endTime = anHourFromNowTime;
      opponentNopesInfos.truce.startTime = now;
    } else {
      opponentNopesInfos.truce.opponentRequest = now;
      myNopesInfos.truce.myRequest = now;
    }

    return async.series([ // FIXME rollback etc
      opponent.save.bind(opponent),
      this.save.bind(this),
    ], function(err) {
      if (err) return callback(err);

      // Useless to know that I just asked for a truce
      if (isAcceptingRequest) {
        redisClient.publish(
          this.email,
          {
            inTruce: isAcceptingRequest,
            initiatedByMe: true,
            nopeData: this.friendsNopes[email],
            opponentEmail: email
          }
        );
      }

      redisClient.publish(
        email,
        {
          inTruce: isAcceptingRequest,
          initiatedByMe: false,
          nopeData: opponent.friendsNopes[this.email],
          opponentEmail: this.email
        }
      );

      callback(null, myNopesInfos);
    }.bind(this));
  }.bind(this));
};

User.prototype.breakTruce = function(email, callback) {
  if (!this.hasFriend(email)) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FRIEND));
  var now = Date.now();
  if (!this.friendsNopes[email].truce) return callback(null, this.friendsNopes[email]);
  if (!this.friendsNopes[email].truce.endTime) return callback(null, this.friendsNopes[email]);
  if (this.friendsNopes[email].truce.endTime > now) {
    // Truce is not over
    return callback(new FriendError(User.FRIEND_STATUSES.IN_TRUCE));
  }

  User.findById(email, function(err, opponent) {
    if (err) return callback(err);
    if (!opponent) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FOUND));

    var myNopeInfosForOpponent = this.friendsNopes[email];
    var opponentFriendsNopesInfosForMe = opponent.friendsNopes[this.email];
    var opponentIsIgnoringMe = opponent.hasIgnored(this.email);
    if (opponentIsIgnoringMe) {
      opponentFriendsNopesInfosForMe = opponent.getIgnoredUserNopeInfos(this.email);
    }

    // Changing the time of the last nope so next nope doesn't take in account
    // the truce

    // The truce lasted for now - time of truce end - 1h
    var truceDuration = now - myNopeInfosForOpponent.truce.startTime;
    myNopeInfosForOpponent.time += truceDuration;
    opponentFriendsNopesInfosForMe.time += truceDuration;

    delete myNopeInfosForOpponent.truce.endTime;
    delete opponentFriendsNopesInfosForMe.truce.endTime;
    // TODO delete startTimes

    myNopeInfosForOpponent.truce.brokenTime = now;
    myNopeInfosForOpponent.truce.brokenByMe = true;
    opponentFriendsNopesInfosForMe.truce.brokenTime = now;
    opponentFriendsNopesInfosForMe.truce.brokenByMe = false;

    return async.series([ // FIXME rollback etc
      opponent.save.bind(opponent),
      this.save.bind(this),
    ], function(err) {
      if (err) return callback(err);

      if (opponentIsIgnoringMe) return callback(null, this.friendsNopes[email]);

      redisClient.publish(
        email,
        {
          brokenTruceTime: now,
          opponentEmail: this.email
        }
      );

      callback(null, this.friendsNopes[email]);
    }.bind(this));
  }.bind(this));

};

User.prototype.sendFriendRequest = function(email, callback) {
  var currentUser = this;
  email = email.toLowerCase().trim();
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
    // Restore ignored user // TODO move in restoreIgnoredUser method
    return callback(null, User.FRIEND_STATUSES.IGNORED);
  }

  User.findById(email, function(err, potentialFriend) {
    if (err) return callback(err);

    if (!potentialFriend) return callback(new FriendError(User.FRIEND_STATUSES.NOT_FOUND)); // No user // FIXME probably send mail here
     // Do not tell a user he's been ignored
    if (potentialFriend.hasIgnored(currentUser.email)) return callback(null, User.FRIEND_STATUSES.PENDING);

    // TODO Thing about separating all that in 2 methods (sendFriendRequest, acceptFriendRequest)

    var callbackStatus;

    if (potentialFriend.hasFriend(currentUser.email) || potentialFriend.hasIgnored(currentUser.email)) {
      // The users already knew each other,
      callbackStatus = User.FRIEND_STATUSES.FRIEND; // Opponent will be noped & notified
    } else if (potentialFriend.hasInvited(currentUser.email)) {
      // Become friends !
      potentialFriend.removeFromInvitedUsers(currentUser.email);
      currentUser.removeFromPendingUsers(potentialFriend.email);
      potentialFriend.friendsNopes[currentUser.email] = {}; // Sets them as friends
      currentUser.friendsNopes[potentialFriend.email] = {}; // Sets them as friends
      callbackStatus = User.FRIEND_STATUSES.FRIEND; // Opponent will be noped & notified, OK.
      currentUser.earnAchievementsAfterNewFriends();
      potentialFriend.earnAchievementsAfterNewFriends();
    } else {
      // Send friend request
      currentUser.invitedUsers.push({
        email: potentialFriend.email,
        opponentName: potentialFriend.name
      });
      potentialFriend.pendingUsers.push({
        email: currentUser.email,
        opponentName: currentUser.name
      });
      callbackStatus = User.FRIEND_STATUSES.PENDING;
    }

    async.series([
      function(cbParallel) { currentUser.save(cbParallel); },
      function(cbParallel) { potentialFriend.save(cbParallel); }
    ], function(err) {
      if (err) return callback(err);

      if (callbackStatus === User.FRIEND_STATUSES.PENDING) {
        redisClient.publish(
          potentialFriend.email,
          {
            pendingUser: {
              email: currentUser.email,
              opponentName: currentUser.name
            }
          }
        );
        return callback(
          null,
          callbackStatus,
          {
            email: potentialFriend.email,
            opponentName: potentialFriend.name
          }
        );
      }
      currentUser.nopeAt(potentialFriend.email, function(err, nopeInfos) {
        return callback(err, callbackStatus, nopeInfos);
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

User.prototype.removeFromInvitedUsers = function(email) {
  return this._removeFromUsers('invitedUsers', email);
};

User.prototype.removeFromPendingUsers = function(email) {
  return this._removeFromUsers('pendingUsers', email);
};

User.prototype.removeFromIgnoredUsers = function(email) {
  return this._removeFromUsers('ignoredUsers', email);
};

User.prototype.getIgnoredUserNopeInfos = function(email) {
  var ignoredUser = null;
  this.ignoredUsers.some(function(user) {
    if (user.email !== email) return false;
    ignoredUser = user;
    return true;
  });
  return ignoredUser;
};

User.prototype.ignoreUser = function(email, callback) {
  var self = this;
  email = email.toLowerCase().trim();

  if (self.hasIgnored(email)) { // already ignored
    return callback();
  }

  User.findById(email, function(err, ignoredUser) {
    if (err) return callback(err);
    if (!ignoredUser) return callback(new Error(User.FRIEND_STATUSES.NOT_FOUND));

    var ignoredUserData;
    if (self.hasFriend(ignoredUser.email)) {
      // Save the most data possible
      ignoredUserData = _.clone(self.friendsNopes[ignoredUser.email]);
      ignoredUserData.email = ignoredUser.email;
      delete self.friendsNopes[ignoredUser.email];
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
  email = email.toLowerCase().trim();

  var restoredUser = this.removeFromIgnoredUsers(email);
  if (!restoredUser) return callback(); // Was not ignored
  if (!! restoredUser.nopesCpt) { // We previously had the user as friend
    this.friendsNopes[restoredUser.email] = restoredUser;
    delete this.friendsNopes[restoredUser.email].email; // Data just added for save in ignored users
    return this.save(callback);
  }
  // If we're here, it means the user did not have the other one as friend
  this.sendFriendRequest(email, callback); // so this is the first nope
};

/**
 * Note : nothing is saved here
 * @param  {[type]} userAchievementsFunction [description]
 * @param  {[type]} nopeData                 Optional
 * @return {[type]}                          [description]
 */
User.prototype.earnAchievements = function(userAchievementsFn, nopeData) {
  var achievedIds = userAchievements[userAchievementsFn](this, nopeData);
  if (!achievedIds.length) return;

  achievedIds.forEach(function(achievedId) {
    this.achievements[achievedId] = true;

    redisClient.publish(
      this.email,
      {
        achievement: achievedId
      }
    );
  }, this);
};

User.prototype.earnAchievementsAfterNoping = function(nopeData) {
  this.earnAchievements('earnedAfterNoping', nopeData);
};

User.prototype.earnAchievementsAfterNewFriends = function() {
  this.earnAchievements('earnedAfterNewFriends');
};

function formatNopeDataForPrimus(nopeData, email) {
  nopeData.email = email;
  return nopeData;
}

module.exports = User;
