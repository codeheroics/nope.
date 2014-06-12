'use strict';

PokeGame.PokeServerManager = Ember.Object.extend({
  updateSelfInfos: function(store) {
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
        store.find('user', 1)
          .then(
            function foundUser(user) {
              return Promise.resolve(user);
            },
            function didNotFindUser() {
              var user = store.createRecord('user', {
                id: 1
              });
              return Promise.resolve(user);
            }
          )
          .then(
            function(user) {
              user.set('name', data.name);
              user.set('email', data.email);
              user.set('avatar', data.avatar);
              // user.set points ?
              user.save();
            }
          );
      })
      .fail(function() {
        console.log('Failed at getting user self infos :(');
      });
  },

  getPokes: function(store) {
    var updateData = function(dataPoke, email) {
    var pokeId = dataPoke.time.toString() + email;
    store.find('poke', pokeId)
      .then(
        function foundPoke(data) { console.log('Do nothing'); },
        function notFoundPoke() {
          // Poke not found, creating a record for it
          var pokeRecord = store.createRecord('poke', {
            id: pokeId,
            isReceived: dataPoke.isPokingMe,
            date: new Date(dataPoke.time),
            points: 0
          });

          store.find('opponent', email)
            .then(
              function foundOpponent(opponent) {
                opponent.set('isScoring', dataPoke.isPokingMe);
                opponent.set('scoreFor', 0);
                opponent.set('scoreAgainst', 0);
                return Promise.resolve(opponent);
              },
              function notFoundOpponent() {
                var opponentRecord = store.createRecord('opponent', {
                  id: email,
                  email: email,
                  name: 'BB',
                  scoreFor: 0,
                  scoreAgainst: 0,
                  isScoring: dataPoke.isPokingMe
                });
                return Promise.resolve(opponentRecord);
              }
            )
            .then(function(opponent) {
              return opponent.get('pokes').then(
                function(pokes) {
                  pokes.pushObject(pokeRecord);
                  opponent.save();
                  pokeRecord.set('opponent', opponent);
                  pokeRecord.save();
                }
              );
            });
        }
      );
    };


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
        for (var email in dataPokes) {
          if (!dataPokes.hasOwnProperty(email)) continue;

          var dataPoke = dataPokes[email];
          updateData(dataPoke, email);
        }
        // Compare and update (a poke can be identified with its timestamp)
      })
      .fail(function(a, b, c) {console.log(a, b, c);
        alert('failed :(');
        // :(
      });

  }
});
/*
function PokeServerManager() {}

PokeServerManager.prototype.updateSelfInfos = function() {
};

PokeServerManager.prototype.getPokes = function() {
};

PokeServerManager.prototype.pokeAt = function(email) {
  $.post(POKES_ROUTE + '/' + email)
    .done(function(data) {
      // Get new data (scores, etc) to update
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      // :(
    });
};

*/
