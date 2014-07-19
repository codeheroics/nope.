'use strict';
PokeGame.OpponentPokesController = Ember.ObjectController.extend({
  actions: {
    poke: function(opponent) {
      PokeGame.serverManager.pokeAt(opponent.get('email'));
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
