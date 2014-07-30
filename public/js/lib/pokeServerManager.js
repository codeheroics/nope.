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
          if (data.isPokingMe) self.notifyPoked(data.opponentName);
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
    console.log('You were poked by' + opponentName);
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
        email: email,
        avatar: DEFAULT_AVATAR,
        points: dataPoke.points
      });
    }
    opponent.set('name', dataPoke.opponentName);
    opponent.set('isScoring', dataPoke.isPokingMe);
    opponent.set('scoreFor', dataPoke.opponentScore);
    opponent.set('scoreAgainst', dataPoke.myScore);
    opponent.set('pokesCpt', dataPoke.pokesCpt);
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

          if (user.isLoaded) {
            return user;
          } else {
            user = PokeGame.User.create({
              id: 1
            });
          }

          user.set('name', data.name);
          user.set('email', data.email);
          user.set('avatar', data.avatar || DEFAULT_AVATAR);

          user.save().then(function() {
            var localPendingUsers = PokeGame.Opponent.findQuery({status: 'pending'});
            var localIgnoredUsers = PokeGame.Opponent.findQuery({status: 'ignored'});
            var serverPendingUsers = data.pendingUsers;
            var serverIgnoredUsers = data.ignoredUsers;

            var getEmails = function(array) {
              return array.map(function(el) {
                return el.email;
              });
            };

            var diffByEmail = function(array1, array2) {
              return array1.filter(function(array1Element) {
                return array2.indexOf(array1Element.email) === -1;
              });
            };

            var createUsers = function(usersDatas, status) {
              return usersDatas.map(function(userData) {
                return PokeGame.Opponent.create({
                  id: userData.email,
                  email: userData.email,
                  name: userData.name || userData.email,
                  status: status
                }).save();
              });
            };

            var removeUsers = function(usersData, status) {
              return usersData.map(function(userData) {
                return PokeGame.Opponent.deleteRecord(userData.id);
              });
            };

            var localPendingUsersMails = getEmails(localPendingUsers);
            var localIgnoredUsersMails = getEmails(localIgnoredUsers);
            var serverPendingUsersMails = getEmails(serverPendingUsers);
            var serverIgnoredUsersMails = getEmails(serverIgnoredUsers);

            var newPendingUsers = diffByEmail(serverPendingUsers, localPendingUsersMails);
            var newIgnoredUsers = diffByEmail(serverIgnoredUsers, localIgnoredUsersMails);
            var removedPendingUsers = diffByEmail(localPendingUsers, serverPendingUsersMails);
            var removedIgnoredUsers = diffByEmail(localPendingUsers, serverIgnoredUsersMails);

            return Promise.all([
              Promise.all(removeUsers(removedIgnoredUsers, 'ignored')),
              Promise.all(removeUsers(removedPendingUsers, 'pending')),
              Promise.all(createUsers(newIgnoredUsers, 'ignored')),
              Promise.all(createUsers(newPendingUsers, 'pending')),
            ]).then(resolve, reject);
          });
        })
        .fail(function() {
          console.log('Failed at getting user self infos :(');
          reject();
        });
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
        alert('failed :(');
        reject();
        // :(
      });
    });
  },

  addOpponent: function(email) {
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
        alert(object.message);
      })
      .fail(function() {
        alert('Could not reach the server :('); // FIXME FIND ALERT BOX
      });
   }
 });
