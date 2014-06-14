'use strict';
PokeGame.OpponentPokesController = Ember.ObjectController.extend({
  actions: {
    poke: function(opponent) {
      var store = this.store;
      $.ajax(
        {
          dataType: 'jsonp',
          data: { friendEmail: opponent.get('email') },
          jsonp: CALLBACK_NAME,
          method: 'post',
          headers: {
            'x-access-token': window.localStorage.getItem('token')
          },
          url: POKES_ROUTE
        }
      )
        .done(function(dataPoke) {
          var pokeId = dataPoke.time.toString() + opponent.get('email');
          var pokeRecord = store.createRecord('poke', {
            id: pokeId,
            isReceived: dataPoke.isPokingMe,
            time: dataPoke.time,
            points: 0,
            opponent: opponent
          });

          opponent.set('isScoring',false);
          opponent.get('pokes').then(function(pokes) {
            pokes.pushObject(pokeRecord);
            pokeRecord.save();
            opponent.save();
          });
        })
        .fail(function() {
          alert('Could not reach the server :('); // FIXME FIND ALERT BOX
        });
    }
  },
  isWinning: function() {
    var scoreFor = this.get('model.scoreFor');
    var scoreAgainst = this.get('model.scoreAgainst');
    return scoreFor > scoreAgainst;
  }.property('model.isWinning')
});
