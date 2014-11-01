'use strict';
NopeGame.OpponentsController = Ember.ArrayController.extend({
  actions: {
    addOpponent: function(email) {
      return NopeGame.serverManager.addOpponent(email);
    },
    ignoreOpponent: function(email) {
      return NopeGame.serverManager.ignoreOpponent(email);
    }
  },

  pendingOpponents: function() {
    var opponents = this.get('model');
    return _.uniq( // FIXME this is a crutch to avoid duplicates, but still better than nothing
      opponents.filterBy('status', 'pending').sortBy('name'),
      true,
      function(el) { return el.get('email'); }
    );
  }.property('model.@each.status'),

  friendOpponents: function() {
    var opponents = this.get('model');
    return _.uniq( // FIXME this is a crutch to avoid duplicates, but still better than nothing
      opponents.filterBy('status', 'friend').sortBy('name'),
      true,
      function(el) { return el.get('email'); }
    );
  }.property('model.@each.status', 'clock.pulse')
});
