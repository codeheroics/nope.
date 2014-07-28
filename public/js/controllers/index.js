'use strict';
PokeGame.IndexController = Ember.ArrayController.extend({
  opponentPokingMe: function() {
    var opponents = this.get('model');
    var friends = opponents.filterBy('status', 'friend');
    var scoringOpponents = friends.filterBy('isScoring', true);
    return scoringOpponents.length > 0 ? scoringOpponents[0] : null;
  }.property('model.@each.isScoring'),

  pendingOpponents: function() {
    var opponents = this.get('model');
    return opponents.filterBy('status', 'pending');
  }.property('model')
});
