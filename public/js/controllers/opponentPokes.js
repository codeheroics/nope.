'use strict';
PokeGame.OpponentPokesController = Ember.ObjectController.extend({
  actions: {
    poke: function(opponent) {
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
          var pokeRecord = PokeGame.Poke.create({
            id: pokeId,
            isReceived: dataPoke.isPokingMe,
            time: dataPoke.time,
            points: dataPoke.points
          });

          opponent.set('isScoring',false);
          opponent.set('scoreFor', dataPoke.opponentScore);
          opponent.set('scoreAgainst', dataPoke.myScore); // In case data was not up to date
          opponent.set('pokesCpt', dataPoke.pokesCpt);
          opponent.get('pokes').pushObject(pokeRecord);
          pokeRecord.set('opponent', opponent);

          return opponent.save().then(function() {
            return pokeRecord.save();
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
  }.property('model.isWinning'), // FIXME

  pokes: function() {
    return this.get('model.pokes').toArray().reverse();
  }.property('model.pokes'),

  scoreFor: function() {
    return this.get('model.scoreFor').toLocaleString();
  }.property('model.scoreFor'),

  scoreAgainst: function() {
    return this.get('model.scoreAgainst').toLocaleString();
  }.property('model.scoreAgainst')
});
