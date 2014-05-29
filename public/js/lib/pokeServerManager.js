var SERVER_URL = 'http://localhost:8000';
var USERS_ROUTE = SERVER_URL + '/users';
var SELF_ROUTE = USERS_ROUTE + '?me';
var POKES_ROUTE = SERVER_URL + '/pokes';

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
    $.getJSON(POKES_ROUTE + '?callback=?')
      .done(function(dataPokes) {
        alert('done');
        for (var email in dataPokes) {
          if (!dataPokes.hasOwnProperty(email)) continue;
          var dataPoke = dataPokes[email];
          var pokeId = dataPoke.time + email;
          if (store.recordIsLoaded(App.Poke, pokeId)) return;
          store.push('poke', dataPoke);
          var opponent = store.find('opponent', email);
          opponent.pokes.push(pokeId);
          opponent.save();
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
