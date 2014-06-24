PokeGame.IndexController = Ember.ArrayController.extend({
  opponentPokingMe: function() {
    var opponents = this.get('model');
    var scoringOpponents = opponents.filterBy('isScoring', true);
    return scoringOpponents.length > 0 ? scoringOpponents[0] : null;
  }.property('model.@each.isScoring')
});
