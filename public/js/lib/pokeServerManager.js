'use strict';

PokeGame.PokeServerManager = Ember.Object.extend({
  init: function() {
    var self = this;
    this.getAllPokes().then(function() {
      self.initPrimus();
    });

  },

  initPrimus: function() {
    var self = this;
    this.primus = Primus.connect(
      PRIMUS_ROUTE, { strategy : ['online', 'disconnect'] }
    );

    //
    // For convenience we use the private event `outgoing::url` to append the
    // authorization token in the query string of our connection URL.
    //
    this.primus.on('outgoing::url', function connectionURL(url) {
      url.query = 'access_token=' + (localStorage.getItem('token') || '');
    });

    this.primus.on('data', function(data) {
      if (data.isPokingMe !== undefined) {
        // Data from a poke
        self.handlePokeResult(data).then(function() {
          if (data.isPokingMe) {
            self.notifyPoked(data.opponentName);
          }
          else {
            self.notifyPoking(data.opponentName);
          }
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
      }
    });

    this.primus.on('error', function error(err) {
      console.error('Something horrible has happened', err);
    });
  },

  pokeAt: function(opponentEmail) {
    this.primus.write(opponentEmail);
  },

  notifyPoked: function(opponentName) {
    toastr.warning('"Nope." received from <span style="font-weight:bold;">' + opponentName + '</span>.');
  },
  notifyPoking: function(opponentName) {
    toastr.success('"Nope." sent to <span style="font-weight:bold;">' + opponentName + '</span>.');
  },

  handlePokeResult: function(dataPoke, email) {
    email = email ? email : dataPoke.email;
    var pokeId = dataPoke.time.toString() + email;

    var poke = PokeGame.Poke.find(pokeId);

    if (poke.isLoaded) return Promise.resolve(poke); // exit

    var pokeRecord = PokeGame.Poke.create({
      id: pokeId,
      isReceived: dataPoke.isPokingMe,
      time: dataPoke.time,
      points: dataPoke.points
    });

    var opponent = PokeGame.Opponent.find(email);
    if (!opponent.isLoaded) {
      opponent = PokeGame.Opponent.create({
        id: email,
        email: email
      });
    }
    opponent.set('name', dataPoke.opponentName);
    opponent.set('isScoring', dataPoke.isPokingMe);
    opponent.set('scoreFor', dataPoke.opponentScore);
    opponent.set('scoreAgainst', dataPoke.myScore);
    opponent.set('pokesCpt', dataPoke.pokesCpt);
    opponent.set('points', dataPoke.points);
    opponent.set('avatar', dataPoke.DEFAULT_AVATAR);
    opponent.set('status', 'friend');
    var pokes = opponent.get('pokes').pushObject(pokeRecord);

    pokeRecord.set('opponent', opponent);

    return opponent.save().then(function() {
      return pokeRecord.save();
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
          var user = PokeGame.User.find(1);

          if (!user.isLoaded) {
            user = PokeGame.User.create({
              id: 1
            });
          }

          user.set('name', data.name);
          user.set('email', data.email);
          user.set('avatar', data.avatar || DEFAULT_AVATAR);

          user.save()
          .then(self.updateFriendsInfos.bind(self, data))
          .then(resolve, reject);
        })
        .fail(function() {
          console.log('Failed at getting user self infos :(');
          reject();
        });
    });
  },

  // FIXME this doesn't really have anything to do with "server" logic
  updateFriendsInfos: function(data) {
    var localPendingUsers = PokeGame.Opponent.findQuery({status: 'pending'});
    var localIgnoredUsers = PokeGame.Opponent.findQuery({status: 'ignored'});
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

  // FIXME this has nothing to do with "server" logic
  // This function must ONLY be used for pending or ignored opponents
  // Data is missing to be used for friends.
  createPendingOrIgnoredUsers: function(usersData, status) {
    if (usersData instanceof Array === false) usersData = [usersData];
    return usersData.map(function(userData) {

      var opponent = PokeGame.Opponent.find(userData.email);
      if (!opponent.isLoaded) {
        opponent = PokeGame.Opponent.create({
          id: userData.email,
          email: userData.email
        });
      }
      opponent.set('name', userData.opponentName);
      opponent.set('status', status);
      return opponent.save();
    });
  },

  createPendingOrIgnoredUser: function(userData, status) {
    return Promise.all(this.createPendingOrIgnoredUsers(userData, status)).then(function(results) {
      return results[0];
    });
  },

  // FIXME this has nothing to do with "server" logic
  // This function must ONLY be used for pending or ignored opponents
  // Data is missing to be used for friends.
  removePendingOrIgnoredUsers: function(usersData) {
    if (usersData instanceof Array === false) usersData = [usersData];
    return usersData.map(function(userData) {
      return PokeGame.Opponent.removeFromRecordArrays(userData);
    });
  },

  getAllPokes: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      $.ajax(
        {
          dataType: 'jsonp',
          jsonp: CALLBACK_NAME,
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: POKES_ROUTE
        }
      )
      .done(function(dataPokes) {
        var email = Object.keys(dataPokes);
        var promises = email.map(function(email) {
          var dataPoke = dataPokes[email];
          return self.handlePokeResult(dataPoke, email);
        });

        return resolve(Promise.all(promises));
      })
      .fail(function(a, b, c) {
        console.error('failed getting pokes')
        reject();
        // :(
      });
    });
  },

  getPokesFrom: function(email) {
    // TODO implement me, for now redirecting to getallpokes
    console.log('Implement me (getPokesFrom)');
    return this.getAllPokes();
  },

  addOpponent: function(email) {
    var self = this;
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
          if (object.message !== 'Friend') {
            toastr.info(object.message);
            resolve();
            return;
          }
          return self.getPokesFrom(email).then(function() {
            var opponentName = PokeGame.Opponent.find(email).get('name');
            resolve();
          });
        })
        .fail(function(xhr) {
          if (!xhr.responseJSON) {
            toastr.error('Could not reach the Internet :(');
          } else {
            toastr.error('Sorry, there was an error: ' + xhr.responseJSON.message);
          }
          reject();
        });
    });
  },

  ignoreOpponent: function(email) {

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
        .done(resolve)
        .fail(function(xhr) {
          if (!xhr.responseJSON) return toastr.error('Could not reach the Internet :(');
          toastr.error('Sorry, there was an error :('); // FIXME FIND ALERT BOX
          reject();
        });
    });
  }
});
