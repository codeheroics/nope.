'use strict';
PokeGame.OpponentPokesController = Ember.ObjectController.extend({
  actions: {
    poke: function(opponent) {
      PokeGame.serverManager.pokeAt(opponent.get('email'));
    },

    ignore: function(opponent) {
      PokeGame.serverManager.ignoreOpponent(opponent.get('email'))
      .then(function() {
        this.transitionToRoute('opponents');
      }.bind(this));
    }
  },

  myAvatar: function() {
    return PokeGame.User.find(1).get('avatar');
  }.property('myAvatar'),

  isWinning: function() {
    var timeFor = this.get('model.timeFor');
    var timeAgainst = this.get('model.timeAgainst');
    return timeFor > timeAgainst;
  }.property('model.timeFor', 'model.timeAgainst'),
});
