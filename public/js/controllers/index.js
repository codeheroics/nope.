'use strict';
PokeGame.IndexController = Ember.ArrayController.extend({
  actions: {
    addOpponent: function(email) {
      return PokeGame.serverManager.addOpponent(email);
    },
    ignoreOpponent: function(email) {
      return PokeGame.serverManager.ignoreOpponent(email);
    }
  },

  opponentsPokingMe: function() {
    var opponents = this.get('model');
    var friends = opponents.filterBy('status', 'friend');
    var scoringOpponents = friends.filterBy('isScoring', true);
    return scoringOpponents.length > 0 ? scoringOpponents : null;
  }.property('model.@each.isScoring'),

  pendingOpponents: function() {
    var opponents = this.get('model');
    return opponents.filterBy('status', 'pending');
  }.property('model.@each.status')
});
