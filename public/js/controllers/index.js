'use strict';
NopeGame.IndexController = Ember.ArrayController.extend({
  actions: {
    addOpponent: function(email) {
      return NopeGame.serverManager.addOpponent(email);
    },
    ignoreOpponent: function(email) {
      return NopeGame.serverManager.ignoreOpponent(email);
    }
  },

  opponentsNopingMe: function() {
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
