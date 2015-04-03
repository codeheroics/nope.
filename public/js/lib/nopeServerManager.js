'use strict';

// TODO make of this a general manager, move things in different ones
// (nopeManager for example)

NopeGame.NopeServerManager = Ember.Object.extend({
  isLoading: true,
  setLoading: function(bool, timeout) {
    this.isLoading = bool;
    if (!bool) { // Disable loading
      NopeGame.notificationManager.clearLoading();
    } else { // enable loading
      NopeGame.notificationManager.showLoading(timeout);
    }
  },

  init: function() {
    this.setLoading(true);
    this.initPrimus();
  },

  initPrimus: function() {
    this.primus = Primus.connect(
      PRIMUS_ROUTE,
      {
         // Using timeout is unadvised but to get here, you must be logged
        strategy : ['online', 'disconnect', 'timeout'],
        reconnect: {
          'reconnect timeout': 10000,
          max: 10000, // Number: The max delay for a reconnect retry.
          min: 1000, // Number: The minimum delay before we reconnect.
          retries: Infinity // Number: How many times should we attempt to reconnect.
        }
      }
    );

    // If we were deconnected and reconnect, we need to get the data we missed
    this.primus.on('open', function() {
      Promise.all([
        this.getAllNopes(),
        this.updateSelfInfos()
      ]).then(function() {
        this.setLoading(false);
      }.bind(this));
    }.bind(this));

    this.primus.on('reconnect scheduled', function(opts) {
      this.setLoading(true, opts.timeout);
    }.bind(this));

    // For convenience we use the private event `outgoing::url` to append the
    // authorization token in the query string of our connection URL.
    this.primus.on('outgoing::url', function connectionURL(url) {
      url.query = 'access_token=' + (localStorage.getItem('token') || '');
    });

    this.primus.on('data', function(data) {
      if (data.isNopingMe !== undefined) {
        // Data from a nope
        this.handleNopeResult(data).then(function() {
          if (data.isNopingMe) {
            NopeGame.notificationManager.notifyNoped(data);
          }
          // else {
            // We are notify that we are noping because we made the HTTP call there
            // in the nopeAt method
            // this.notifyNoping(data);
          // }
        });
        return;
      }

      if (data.pendingUser !== undefined) {
        // New pending user
        this.createUser(data.pendingUser, 'pending')
        .then(function(pendingOpponent) {
          toastr.info('A new noper, <span style="font-weight:bold;">' + pendingOpponent.get('name') +
            '</span>, challenges you!');
        });
        return;
      }

      if (data.ignoredUser !== undefined) {
        // New ignored user
        this.createUser(data.ignoredUser, 'ignored');
        return;
        // No toastr here : user has feedback from HTTP DELETE on device where he ignores,
        // let's not introduce any race condition wondering if a toastr should be shown or not (HTTP VS Websocket speed
        // )
        // .then(function(ignoredOpponent) {
        //   toastr.info('You are now ignoring <span style="font-weight:bold;">' + ignoredOpponent.get('name') +
        //     '</span>.');
        // });
      }

      if (data.achievement !== undefined) {
        NopeGame.achievementsManager.unlock(data.achievement);
        return;
      }

      if (data.reset !== undefined) {
        this.handleNopeResult(data.nopeData, data.opponentEmail)
        .then(function() {
          if (data.victory) {
            return this.incrUserVictories();
          }
          this.incrUserDefeats();
        }.bind(this));
        return;
      }

      var opponent;

      if (data.inTruce !== undefined) {
        opponent = NopeGame.Opponent.find(data.opponentEmail);
        if (!opponent.isLoaded) return;
        if (data.inTruce) {
          opponent.set('inTruceFrom', data.nopeData.truce.startTime);
          opponent.set('inTruceUntil', data.nopeData.truce.startTime + 60 * 60 * 1000);
          opponent.set('lastNopeTime', data.nopeData.time);
          opponent.save();
          // Doesn't matter if done twice, it will instantly be replaced
          NopeGame.notificationManager.notifyAcceptedTruce(opponent);
        } else {
          if (data.initiatedByMe) return; // Of course, if we sent it, we did not receive it.
          NopeGame.notificationManager.notifyReceivedTruceRequest(opponent);
        }
        return;
      }

      if (data.brokenTruceTime !== undefined) {
        opponent = NopeGame.Opponent.find(data.opponentEmail);
        if (!opponent.isLoaded) return;

        opponent.set('truceBrokenTime', data.brokenTruceTime);
        opponent.set('lastNopeTime', data.nopeData.time);
        return opponent.save().then(function() {
          NopeGame.notificationManager.notifyTruceBrokenByOpponent(opponent);
        }.bind(this));
      }

      // time difference between us and the server
      if (data.time !== undefined) {
        this.setTimeDiff(parseInt((Date.now() - data.time) || 0, 10));
        return;
      }
    }.bind(this));
  },

  endPrimus: function() {
    if (!this.primus) return;
    this.primus.end();
  },

  setTimeDiff: function(timeDiff) {
    window.localStorage.setItem('serverTimeDiff', timeDiff);
  },

  nopeAt: function(opponentEmail) {
    return new Promise(function(resolve, reject) {
      $.ajax(
        {
          data: { friendEmail: opponentEmail },
          jsonp: CALLBACK_NAME,
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          method: 'POST',
          url: NOPES_ROUTE
        }
      )
      .done(function(data) {
        this.handleNopeResult(data)
        .then(NopeGame.notificationManager.notifyNoping.bind(NopeGame.notificationManager, data))
        .then(this.cleanNopeDatas.bind(this))
        .then(resolve);
      }.bind(this))
      .fail(function(xhr) {
        if (!xhr.responseJSON) {
          toastr.error('Could not reach the Internet :(');
        } else {
          toastr.error('Sorry, there was an error with the server when trying to send a nope to ' + opponentEmail);
        }
        reject();
      }.bind(this));
    }.bind(this));
  },

  handleNopeResult: function(dataNope, email) {
    email = email ? email : dataNope.email;
    if (!email) return Promise.reject(); // may correct problems with duplicate users
    var nopeId = '' + dataNope.time + email;

    var nope = NopeGame.Nope.find(nopeId);

    if (nope.isLoaded) return Promise.resolve(nope); // exit (already handled)

    // Set maual time diff in case we have a time in the future with the current latency
    var now = Date.now();
    if (now - window.localStorage.getItem('serverTimeDiff') - dataNope.time < 0) {
      this.setTimeDiff(now - dataNope.time);
    }

    var nopeRecord = NopeGame.Nope.create({
      id: nopeId,
      isReceived: dataNope.isNopingMe,
      time: dataNope.time,
      timeDiff: dataNope.timeDiff
    });

    var opponent = NopeGame.Opponent.find(email);
    if (!opponent.isLoaded) {
      opponent = NopeGame.Opponent.create({
        id: email,
        email: email
      });
    }

    var victoriesBefore = opponent.get('victories') || 0;
    var defeatsBefore = opponent.get('defeats') || 0;

    // Previously, (before october) there was no "lastResetDecidedByMe" --> undefined means true.
    var lastResetDecidedByMe = dataNope.lastResetDecidedByMe || (dataNope.lastResetDecidedByMe === undefined);

    opponent.set('name', dataNope.opponentName);
    opponent.set('isScoring', dataNope.isNopingMe);
    opponent.set('timeFor', dataNope.opponentTimeNoping);
    opponent.set('timeAgainst', dataNope.myTimeNoping);
    opponent.set('nopesCpt', dataNope.nopesCpt);
    opponent.set('avatar', generateGravatar(email));
    opponent.set('status', 'friend');
    opponent.set('lastNopeTime', dataNope.time);
    opponent.set('inTruceFrom', dataNope.truce && dataNope.truce.startTime);
    opponent.set('inTruceUntil', dataNope.truce && dataNope.truce.startTime && dataNope.truce.startTime + 3600000);
    opponent.set('truceBrokenTime', dataNope.truce && dataNope.truce.brokenTime);
    opponent.set('victories', dataNope.victories || 0);
    opponent.set('defeats', dataNope.defeats || 0);
    opponent.set('lastResetTime', dataNope.lastResetTime || null);
    opponent.set('lastResetDecidedByMe', lastResetDecidedByMe);
    var nopes = opponent.get('nopes').pushObject(nopeRecord);
    nopeRecord.set('opponent', opponent);

    return opponent.save().then(function() {
      return nopeRecord.save();
    }).then(function() {
      // If nothing was logged (re-login), give up notifying >> Do not do it. We'll suppose a lot of false positives are better than nothing.
      // if (timeForBefore === undefined || timeAgainstBefore === undefined) return Promise.resolve();
      var victories = dataNope.victories || 0;
      var defeats = dataNope.defeats || 0;
      // I must be notified here if the other one did a reset and I haven't answered yet
      // (if I decided of the reset, I must be notified after handling the data)
      if (lastResetDecidedByMe) return Promise.resolve();
      var funcName;
      // Different checks in case I decide to give bonus time when declaring defeat
      if (victories > victoriesBefore && opponent.get('computedTimeAgainst') === 0) { // I won, I haven't answered yet so I am not scoring
        funcName = 'notifyOpponentAdmittedDefeat';
      } else if (defeats > defeatsBefore && opponent.get('timeFor') === 0) { // I lost, I haven't answered yet so opponent hasn't scored
        funcName = 'notifyOpponentDeclaredVictory';
      } else { // Nothing to notify
        return Promise.resolve();
      }
      return NopeGame.notificationManager[funcName](opponent);
    });
  },

  cleanNopeDatas: function() {

    // We do not touch the 25 most recent nopes keep 25 of them for history
    var allNopes = NopeGame.Nope.find().sortBy('time').reverse();

    if (allNopes.length < 100) return; // Prevents this being called too often

    var usersWithPreviousNopes = [];

    allNopes.forEach(function(nope, index) {
      var noperMail = nope.get('opponent').get('email');

      // Do not clean up :
      // * nopes for users for which we did not have nopes yet
      // * the 25 first nopes.
      if (usersWithPreviousNopes.indexOf(noperMail) === -1) {
        usersWithPreviousNopes.push(noperMail);
        return;
      }

      if (index < NOPES_HISTORY_LENGTH) return;
      // We can cleanup this nope
      nope.deleteRecord();
    });
  },

  updateSelfInfos: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      $.ajax(
        {
          jsonp: CALLBACK_NAME,
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: SELF_ROUTE,
          cache: false
        }
      )
        .done(function(data) {
          var user = NopeGame.User.find(1);

          if (!user.isLoaded) {
            user = NopeGame.User.create({
              id: 1
            });
          }

          var avatar = generateGravatar(data.email);

          user.set('name', data.name);
          user.set('email', data.email);
          user.set('avatar', avatar);
          localStorage.setItem('avatar', avatar);
          user.set('timeNoping', data.timeNoping);
          user.set('totalNopes', data.totalNopes);
          user.set('victories', data.victories);
          user.set('defeats', data.defeats);
          NopeGame.achievementsManager.update(data.achievements);

          user.save()
          .then(self.updateFriendsInfos.bind(self, data))
          .then(resolve, reject);
        })
        .fail(reject);
    });
  },

  // TODO this doesn't really have anything to do with "server" logic
  updateFriendsInfos: function(data) {
    var localPendingUsers = NopeGame.Opponent.findQuery({status: 'pending'});
    var localIgnoredUsers = NopeGame.Opponent.findQuery({status: 'ignored'});
    var localInvitedUsers = NopeGame.Opponent.findQuery({status: 'invited'});
    var serverPendingUsers = data.pendingUsers;
    var serverIgnoredUsers = data.ignoredUsers;
    var serverInvitedUsers = data.invitedUsers;

    var getEmails = function(array) {
      return array.map(function(el) {
        return el.email;
      });
    };

    var getEmailsFromEmberObjects = function(emberObject) {
      var array = emberObject.toArray();
      return array.map(function(el) {
        return el.get('email');
      });
    };

    var diffByEmail = function(array1, array2) {
      return array1.filter(function(array1Element) {
        return array2.indexOf(array1Element.email) === -1;
      });
    };

    var diffByEmailFromEmberObjects = function(emberObjects, mailArray) {
      return emberObjects.filter(function(emberObject) {
        return mailArray.indexOf(emberObject.get('email')) === -1;
      });
    };

    var localPendingUsersMails = getEmailsFromEmberObjects(localPendingUsers);
    var localIgnoredUsersMails = getEmailsFromEmberObjects(localIgnoredUsers);
    var localInvitedUsersMails = getEmailsFromEmberObjects(localInvitedUsers);
    var serverPendingUsersMails = getEmails(serverPendingUsers);
    var serverIgnoredUsersMails = getEmails(serverIgnoredUsers);
    var serverInvitedUsersMails = getEmails(serverInvitedUsers);
    var newPendingUsers = diffByEmail(serverPendingUsers, localPendingUsersMails);
    var newIgnoredUsers = diffByEmail(serverIgnoredUsers, localIgnoredUsersMails);
    var newInvitedUsers = diffByEmail(serverInvitedUsers, localInvitedUsersMails);
    var removedPendingUsers = diffByEmailFromEmberObjects(localPendingUsers, serverPendingUsersMails);
    var removedIgnoredUsers = diffByEmailFromEmberObjects(localIgnoredUsers, serverIgnoredUsersMails);
    var removedInvitedUsers = diffByEmailFromEmberObjects(localInvitedUsers, serverInvitedUsersMails);

    return Promise.all([
      Promise.all(this.removePendingOrIgnoredUsers(removedIgnoredUsers, 'ignored')),
      Promise.all(this.removePendingOrIgnoredUsers(removedPendingUsers, 'pending')),
      Promise.all(this.removePendingOrIgnoredUsers(removedInvitedUsers, 'invited')),
      Promise.all(this.createUsers(newIgnoredUsers, 'ignored')),
      Promise.all(this.createUsers(newPendingUsers, 'pending')),
      Promise.all(this.createUsers(newInvitedUsers, 'invited')),
    ]);
  },

  // TODO this has nothing to do with "server" logic
  // This function must ONLY be used for pending or ignored opponents
  // Data is missing to be used for friends.
  createUsers: function(usersData, status) {
    if (usersData instanceof Array === false) usersData = [usersData];
    return usersData.map(function(userData) {

      var opponent = NopeGame.Opponent.find(userData.email);
      if (!opponent.isLoaded) {
        opponent = NopeGame.Opponent.create({
          id: userData.email,
          email: userData.email
        });
      }
      opponent.set('name', userData.opponentName);
      opponent.set('avatar', generateGravatar(userData.email));
      opponent.set('status', status);
      return opponent.save();
    });
  },

  createUser: function(userData, status) {
    return Promise.all(this.createUsers(userData, status)).then(function(results) {
      return results[0];
    });
  },

  // TODO this has nothing to do with "server" logic
  // This function must ONLY be used for pending or ignored opponents
  // Data is missing to be used for friends.
  removePendingOrIgnoredUsers: function(usersData) {
    if (usersData instanceof Array === false) usersData = [usersData];
    return usersData.map(function(userData) {
      return NopeGame.Opponent.removeFromRecordArrays(userData);
    });
  },

  getAllNopes: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      $.ajax(
        {
          jsonp: CALLBACK_NAME,
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: NOPES_ROUTE,
          cache: false
        }
      )
      .done(function(dataNopes) {
        var email = Object.keys(dataNopes);
        var promises = email.map(function(email) {
          var dataNope = dataNopes[email];
          return self.handleNopeResult(dataNope, email);
        });

        return resolve(Promise.all(promises));
      })
      .fail(reject);
    });
  },

  getNopesFrom: function(email) {
    // TODO implement me, for now redirecting to getallnopes
    // console.log('Implement me (getNopesFrom)');
    return this.getAllNopes();
  },

  addOpponent: function(email) {
    var self = this;

    if (!validator.isEmail(email)) return toastr.error('Invalid e-mail');

    var existingOpponent = NopeGame.Opponent.find(email);
    if (existingOpponent.isLoaded && existingOpponent.get('status') !== 'pending') {
      toastr.warning('You already have this user as ' + existingOpponent.get('status'));
      return Promise.reject();
    }

    return new Promise(function(resolve, reject) {
      $.ajax(
        {
          data: { friendEmail: email },
          jsonp: CALLBACK_NAME,
          method: 'POST',
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: USERS_ROUTE
        }
      )
        .done(function(object) {
          if (object.message === 'Friend') {
            if (!object.nopeData) {
              return self.getNopesFrom(email).then(resolve);
            }
            return self.handleNopeResult(object.nopeData)
            .then(NopeGame.notificationManager.notifyNoping.bind(NopeGame.notificationManager, object.nopeData))
            .then(resolve);
          }

          // We don't necessarily have an object.invitedUser (if the user is already pending for example)
          var promise = Promise.resolve();
          if (object.invitedUser) {
            self.createUser(object.invitedUser, 'invited');
          }

          promise.then(function(invitedUser) {
            var name = existingOpponent.get('name') || email;
            if (invitedUser) {
              name = invitedUser.get('name');
              email = invitedUser.get('email');
            }
            toastr.info(
              'Sent a request to <span style="font-weight:bold;">' + name +
              '</span> ' + (name !== email ? '(' + email + ')' : '')
            );
            resolve();
          });

        })
        .fail(function(xhr) {
          if (!xhr.responseJSON) {
            toastr.error('Could not reach the Internet :(');
          } else {
            if (xhr.status !== 403) {
              toastr.error('There was an error with the server when trying to add ' + email, 'Sorry');
            } else {
              if (xhr.responseJSON.status === 'Self') {
                toastr.error('You can not be your own friend.', 'Sorry', {timeOut: 5000});
              } else {
                toastr.error('Unknown error', 'Sorry');
              }
            }
          }
          reject();
        });
    });
  },

  ignoreOpponent: function(email) {

    if (!validator.isEmail(email)) return toastr.error('Invalid e-mail');

    return new Promise(function(resolve, reject) {

      $.ajax(
        {
          data: { friendEmail: email },
          jsonp: CALLBACK_NAME,
          method: 'DELETE',
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: USERS_ROUTE
        }
      )
        .done(function() {
          var ignoredOpponent = NopeGame.Opponent.find(email);
          if (!ignoredOpponent.isLoaded) return resolve();
          ignoredOpponent.set('status', 'ignored');
          ignoredOpponent.save().then(function() {
            toastr.info('You are now ignoring <span style="font-weight:bold;">' + ignoredOpponent.get('name') +
              '</span>.');
            resolve();
          });
        })
        .fail(function(xhr) {
          if (!xhr.responseJSON) return toastr.error('Could not reach the Internet :(');
          toastr.error('Sorry, there was an error with the server when trying to ignore ' + email);
          reject();
        });
    });
  },

  unIgnoreOpponent: function(opponent) {
    var self = this;
    var email = opponent.get('email');
    if (!validator.isEmail(email)) return toastr.error('Invalid e-mail');

    return new Promise(function(resolve, reject) {

      $.ajax(
        {
          data: { friendEmail: email },
          jsonp: CALLBACK_NAME,
          method: 'PATCH',
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: USERS_ROUTE + '?unignore'
        }
      )
      .done(function(data) {
        return self.getNopesFrom(email).then(function() {
          opponent.set('status', 'friend');
          return opponent.save();
        })
        .then(function() {
          toastr.info('is no longer ignored', opponent.get('name'));
          if (data.nopeData) {
            return self.handleNopeResult(data.nopeData).then(resolve);
          }
          resolve();
        });
      })
      .fail(function(xhr) {
        toastr.error('Sorry, there was an error with the server when trying to un-ignore ' + opponent.get('name'));
        reject();
      });
    });
  },

  concedeRound: function(opponent) {
    return new Promise(function(resolve, reject) {
      $.ajax(
        {
          data: { friendEmail: opponent.get('email') },
          jsonp: CALLBACK_NAME,
          method: 'PATCH',
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: USERS_ROUTE + '?concede'
        }
      )
      .done(function(data) {
        return this.handleNopeResult(data.nopeData, opponent.get('email'))
        .then(this.incrUserDefeats)
        .then(NopeGame.notificationManager.notifyMyAdmittedDefeat.bind(NopeGame.notificationManager, opponent))
        .then(resolve);
      }.bind(this))
      .fail(function(xhr) {
        if (!xhr.status) {
          toastr.error('Unable to connect to the internet while trying to concede');
        } else if (xhr.status >= 500) {
          toastr.error('Sorry, there was a server error while trying to concede');
        }
        reject();
      });
    }.bind(this));
  },

  declareVictory: function(opponent) {
    return new Promise(function(resolve, reject) {
      $.ajax(
        {
          data: { friendEmail: opponent.get('email') },
          jsonp: CALLBACK_NAME,
          method: 'PATCH',
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: USERS_ROUTE + '?win'
        }
      )
      .done(function(data) {
        return this.handleNopeResult(data.nopeData, opponent.get('email'))
        .then(this.incrUserVictories)
        .then(NopeGame.notificationManager.notifyMyDeclaredVictory.bind(NopeGame.notificationManager, opponent))
        .then(resolve);
      }.bind(this))
      .fail(function(xhr) {
        if (!xhr.status) {
          toastr.error('Unable to connect to the internet while trying to declare victory');
        } else if (xhr.status >= 500) {
          toastr.error('Sorry, there was a server error while trying to declare victory');
        }
        reject();
      });
    }.bind(this));
  },

  requestTruce: function(opponent) {
    return new Promise(function(resolve, reject) {
      $.ajax(
        {
          data: { friendEmail: opponent.get('email') },
          jsonp: CALLBACK_NAME,
          method: 'PATCH',
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: USERS_ROUTE + '?requestTruce'
        }
      )
      .done(function(data) {
        var inTruce = data.nopeData.truce &&
          data.nopeData.truce.startTime < Date.now() &&
          data.nopeData.truce.startTime + 3600000 > Date.now();

        if (inTruce) {
          opponent.set('inTruceFrom', data.nopeData.truce.startTime);
          opponent.set('inTruceUntil', data.nopeData.truce.startTime + 3600000);
          opponent.set('lastNopeTime', data.nopeData.time);
        }

        opponent.save().then(function() {
          if (inTruce) {
            NopeGame.notificationManager.notifyAcceptedTruce(opponent);
          } else {
            NopeGame.notificationManager.notifySentTruceRequest(opponent);
          }
        });
      }.bind(this))
      .fail(function(xhr) {
        if (!xhr.status) {
          toastr.error('Unable to connect to the internet');
        } else if (xhr.status >= 500) {
          toastr.error('Sorry, there was a server error');
        }
        reject();
      });
    }.bind(this));
  },

  breakTruce: function(opponent) {
    return new Promise(function(resolve, reject) {
      $.ajax(
        {
          data: { friendEmail: opponent.get('email') },
          jsonp: CALLBACK_NAME,
          method: 'PATCH',
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: USERS_ROUTE + '?breakTruce'
        }
      )
      .done(function(data) {
        opponent.set('truceBrokenTime', data.nopeData.truce.brokenTime);
        opponent.set('lastNopeTime', data.nopeData.time);

        opponent.save().then(function() {
          NopeGame.notificationManager.notifyTruceBrokenByMe(opponent);
        });
      }.bind(this))
      .fail(function(xhr) {
        if (!xhr.status) {
          toastr.error('Unable to connect to the internet', undefined);
        } else if (xhr.status >= 500) {
          toastr.error('Sorry, there was a server error', undefined);
        }
        reject();
      });
    }.bind(this));
  },

  incrUserVictories: function() {
    var user = NopeGame.User.find(1);
    return user.set('victories', user.get('victories') + 1).save();
  },

  incrUserDefeats: function() {
    var user = NopeGame.User.find(1);
    return user.set('defeats', user.get('defeats') + 1).save();
  }
});
