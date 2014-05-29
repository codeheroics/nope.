PokeGame.OpponentPokesController = Ember.ObjectController.extend({
  isWinning: function() {
    var scoreFor = this.get('model.scoreFor');
    var scoreAgainst = this.get('model.scoreAgainst');
    return scoreFor > scoreAgainst;
  }.property('model.isWinning')
});
