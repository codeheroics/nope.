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
  }.property('model.scoreFor', 'model.scoreAgainst'), // FIXME

  // lastPoke: function() {
  //   var pokes = this.get('model.pokes');
  //   if (!pokes) return null;
  //   return pokes.toArray()[0];
  // }.property('model.pokes'),

  scoreFor: function() {
    var scoreFor = this.get('model.scoreFor');
    if (!scoreFor) return 0;
    return scoreFor.toLocaleString();
  }.property('model.scoreFor'),

  scoreAgainst: function() {
    var scoreAgainst = this.get('model.scoreAgainst');
    if (!scoreAgainst) return 0;
    return scoreAgainst.toLocaleString();
  }.property('model.scoreAgainst')
});
