'use strict';

PokeGame.PokeServerManager = Ember.Object.extend({
  updateSelfInfos: function() {
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
          resolve(user.save());
        })
        .fail(function() {
          console.log('Failed at getting user self infos :(');
          reject();
        });
    });
  },

  getPokes: function() {
    var updateData = function(dataPoke, email) {
      var pokeId = dataPoke.time.toString() + email;

      var poke = PokeGame.Poke.find(pokeId);

      if (poke.isLoaded) return Promise.resolve(poke); // exit

      var pokeRecord = PokeGame.Poke.create({
        id: pokeId,
        isReceived: dataPoke.isPokingMe,
        time: dataPoke.time,
        points: 0
      });

      var opponent = PokeGame.Opponent.find(email);
      if (!opponent.isLoaded) {
        opponent = PokeGame.Opponent.create({
          id: email,
          email: email,
          name: 'BB',
          avatar: DEFAULT_AVATAR
        });
      }
      opponent.set('isScoring', dataPoke.isPokingMe);

      opponent.set('scoreFor', 0);
      opponent.set('scoreAgainst', 0);
      var pokes = opponent.get('pokes').pushObject(pokeRecord);

      pokeRecord.set('opponent', opponent);


      return opponent.save().then(function() {
        return pokeRecord.save();
      });
    };


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
            return updateData(dataPoke, email);
          });

          return resolve(Promise.all(promises));
        })
        .fail(function(a, b, c) {
          alert('failed :(');
          reject();
          // :(
        });
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
