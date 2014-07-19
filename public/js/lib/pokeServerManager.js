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
        name: dataPoke.opponentName,
        avatar: DEFAULT_AVATAR,
        points: dataPoke.points
      });
    }
    opponent.set('isScoring', dataPoke.isPokingMe);
    opponent.set('scoreFor', dataPoke.opponentScore);
    opponent.set('scoreAgainst', dataPoke.myScore);
    var pokes = opponent.get('pokes').pushObject(pokeRecord);

    pokeRecord.set('opponent', opponent);

    return opponent.save().then(function() {
      return pokeRecord.save();
    });
  },

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
  }
});
