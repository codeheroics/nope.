'use strict';
PokeGame.OpponentsController = Ember.ArrayController.extend({
  actions: {
    unIgnoreOpponent: function(model) {
      return PokeGame.serverManager.unIgnoreOpponent(model);
    }
  },

  opponents: function() {
    var opponents = this.get('model');
    return opponents.filterBy('status', 'friend');
  }.property('model.@each.status'),

  ignoredOpponents: function() {
    var opponents = this.get('model');
    return opponents.filterBy('status', 'ignored');
  }.property('model.@each.status')
});
