'use strict';

// TODO make of this a general manager, move things in different ones
// (nopeManager for example)

NopeGame.NopeServerManager = Ember.Object.extend({
  init: function() {
    NopeGame.achievementsManager = NopeGame.AchievementsManager.create();
    return this.getAllNopes().then(this.initPrimus.bind(this));
  },

  initPrimus: function() {
    var self = this;
    this.primus = Primus.connect(
      PRIMUS_ROUTE,
      {
        strategy : ['online', 'disconnect'],
        reconnect: {
          maxDelay: 600000, // Number: The max delay for a reconnect retry.
          minDelay: 15000, // Number: The minimum delay before we reconnect.
          retries: 100000 // Number: How many times should we attempt to reconnect.
        }
      }
    );

    // If we were deconnected and reconnect, we need to get the data we missed
    this.primus.on('reconnected', function() {
      this.getAllNopes();
    }.bind(this));

    // For convenience we use the private event `outgoing::url` to append the
    // authorization token in the query string of our connection URL.
    this.primus.on('outgoing::url', function connectionURL(url) {
      url.query = 'access_token=' + (localStorage.getItem('token') || '');
    });

    this.primus.on('data', function(data) {
      if (data.isNopingMe !== undefined) {
        // Data from a nope
        self.handleNopeResult(data).then(function() {
          if (data.isNopingMe) {
            self.notifyNoped(data);
          }
          // else {
            // We are notify that we are noping because we made the HTTP call there
            // in the nopeAt method
            // self.notifyNoping(data);
          // }
        });
        return;
      }

      if (data.pendingUser !== undefined) {
        // New pending user
        self.createPendingOrIgnoredUser(data.pendingUser, 'pending')
        .then(function(pendingOpponent) {
          toastr.info('A new noper, <span style="font-weight:bold;">' + pendingOpponent.get('name') +
            '</span>, challenges you!');
        });
        return;
      }

      if (data.ignoredUser !== undefined) {
        // New ignored user
        self.createPendingOrIgnoredUser(data.ignoredUser, 'ignored');
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

      // time difference between us and the server
      if (data.time !== undefined) {
        window.localStorage.setItem('serverTimeDiff', (Date.now() - data.time) || 0);
      }
    });

    this.primus.on('error', function error(err) {
      console.error('Something horrible has happened', err);
    });
  },

  endPrimus: function() {
    if (!this.primus) return;
    this.primus.end();
  },

  nopeAt: function(opponentEmail) {
    return new Promise(function(resolve, reject) {
      $.ajax(
        {
          dataType: 'jsonp',
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
        .then(this.notifyNoping.bind(this, data))
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

  notifyNoped: function(nopeData) {
    toastr.warning('received from <span style="font-weight:bold;">' + nopeData.opponentName + '</span>.', 'Nope.');
    return Promise.resolve();
    // .click(function() {
    //   this.transitionTo('/opponents/' + nopeData.opponentEmail);
    // }.bind(this));
  },
  notifyNoping: function(nopeData) {
    toastr.success('sent to <span style="font-weight:bold;">' + nopeData.opponentName + '</span>.', 'Nope.');
    return Promise.resolve();
  },

  handleNopeResult: function(dataNope, email) {
    email = email ? email : dataNope.email;
    if (!email) return Promise.reject(); // may correct problems with duplicate users
    var nopeId = '' + dataNope.time + email;

    var nope = NopeGame.Nope.find(nopeId);

    if (nope.isLoaded) return Promise.resolve(nope); // exit

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
    opponent.set('name', dataNope.opponentName);
    opponent.set('isScoring', dataNope.isNopingMe);
    opponent.set('timeFor', dataNope.opponentTimeNoping);
    opponent.set('timeAgainst', dataNope.myTimeNoping);
    opponent.set('nopesCpt', dataNope.nopesCpt);
    opponent.set('timeDiff', dataNope.timeDiff);
    opponent.set('avatar', generateGravatar(email));
    opponent.set('status', 'friend');
    opponent.set('lastNopeTime', dataNope.time);
    var nopes = opponent.get('nopes').pushObject(nopeRecord);

    nopeRecord.set('opponent', opponent);

    return opponent.save().then(function() {
      return nopeRecord.save();
    });
  },

  updateSelfInfos: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      $.ajax(
        {
          dataType: 'jsonp',
          jsonp: CALLBACK_NAME,
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: SELF_ROUTE
        }
      )
        .done(function(data) {
          var user = NopeGame.User.find(1);

          if (!user.isLoaded) {
            user = NopeGame.User.create({
              id: 1
            });
          }

          user.set('name', data.name);
          user.set('email', data.email);
          user.set('avatar', generateGravatar(data.email));
          user.set('timeNoping', data.timeNoping);
          user.set('totalNopes', data.totalNopes);
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
    var serverPendingUsers = data.pendingUsers;
    var serverIgnoredUsers = data.ignoredUsers;

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
    var serverPendingUsersMails = getEmails(serverPendingUsers);
    var serverIgnoredUsersMails = getEmails(serverIgnoredUsers);
    var newPendingUsers = diffByEmail(serverPendingUsers, localPendingUsersMails);
    var newIgnoredUsers = diffByEmail(serverIgnoredUsers, localIgnoredUsersMails);
    var removedPendingUsers = diffByEmailFromEmberObjects(localPendingUsers, serverPendingUsersMails);
    var removedIgnoredUsers = diffByEmailFromEmberObjects(localIgnoredUsers, serverIgnoredUsersMails);

    return Promise.all([
      Promise.all(this.removePendingOrIgnoredUsers(removedIgnoredUsers, 'ignored')),
      Promise.all(this.removePendingOrIgnoredUsers(removedPendingUsers, 'pending')),
      Promise.all(this.createPendingOrIgnoredUsers(newIgnoredUsers, 'ignored')),
      Promise.all(this.createPendingOrIgnoredUsers(newPendingUsers, 'pending')),
    ]);
  },

  // TODO this has nothing to do with "server" logic
  // This function must ONLY be used for pending or ignored opponents
  // Data is missing to be used for friends.
  createPendingOrIgnoredUsers: function(usersData, status) {
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

  createPendingOrIgnoredUser: function(userData, status) {
    return Promise.all(this.createPendingOrIgnoredUsers(userData, status)).then(function(results) {
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
          dataType: 'jsonp',
          jsonp: CALLBACK_NAME,
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: NOPES_ROUTE
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
      toastr.warning('You already have this user as ' + existingOpponent.get('status'), undefined, {timeOut: 5000});
      return Promise.reject();
    }

    return new Promise(function(resolve, reject) {

      $.ajax(
        {
          dataType: 'jsonp',
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
            self.handleNopeResult(object.nopeData).then(self.notifyNoping.bind(this, object.nopeData));
          }
          toastr.info(
            'Sent a request to <span style="font-weight:bold;">' + email + '</span>',
            undefined,
            { timeOut: 5000 }
          );
          resolve();
        })
        .fail(function(xhr) {
          if (!xhr.responseJSON) {
            toastr.error('Could not reach the Internet :(');
          } else {
            if (xhr.status !== 403) {
              toastr.error('Sorry, there was an error with the server when trying to add ' + email);
            } else {
              if (xhr.responseJSON.status === 'Self') {
                return toastr.error('Sorry. You can not be your own friend.', 'Nope.', {timeOut: 5000});
              }
              toastr.info(
                '<a href="mailto:' + email + '?subject=Nope.wtf&body=Join%20www.nope.wtf!">Invite them to Nope! <i class="fa fa-envelope"></i></a>',
                email + ' is not a member!',
                { timeOut: 15000 }
              );
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
          dataType: 'jsonp',
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
          dataType: 'jsonp',
          data: { friendEmail: email },
          jsonp: CALLBACK_NAME,
          method: 'PATCH',
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: USERS_ROUTE
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
  }
});
