'use strict';

var SERVER_URL = 'http://localhost:8000';
var USERS_ROUTE = SERVER_URL + '/users';
var SELF_ROUTE = USERS_ROUTE + '?me';
var POKES_ROUTE = SERVER_URL + '/pokes';
var LOGIN_ROUTE = SERVER_URL + '/login';
var CALLBACK_NAME = 'pokecb';

PokeGame.PokeServerManager = Ember.Object.extend({
  updateSelfInfos: function() {
    $.getJSON(SELF_ROUTE)
      .done(function(data) {

      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        // :(
      });
  },

  getPokes: function(store) {
    var storedPokes = store.find('poke');
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
        alert('done');
        for (var email in dataPokes) {
          if (!dataPokes.hasOwnProperty(email)) continue;
          var dataPoke = dataPokes[email];
          var pokeId = dataPoke.time + email;
          if (store.recordIsLoaded(PokeGame.Poke, pokeId)) return;
          store.push('poke', dataPoke);

            ////////// WIP HERE

          var opponent = store.all('opponent', {email: email});
          console.log(opponent);
          // console.log(opponent.get('pokes'))
          // opponent.pokes.push(pokeId);
          // opponent.save();
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
