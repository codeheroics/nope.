'use strict';
NopeGame.OpponentsController = Ember.ArrayController.extend({
  sortProperties: ['name'],
  sortAscending: true,

  actions: {
    addOpponent: function(email) {
      return NopeGame.serverManager.addOpponent(email);
    },
    ignoreOpponent: function(email) {
      return NopeGame.serverManager.ignoreOpponent(email);
    }
  },

  singlePendingOpponent: function() {
    return this.get('model')
    .filterBy('status', 'pending')
    .toArray().length === 1;
  }.property('model.@each.status'),

  singleFriendOpponent: function() {
    return this.get('model')
    .filterBy('status', 'friend')
    .toArray().length === 1;
  }.property('model.@each.status'),

  pendingOpponents: function() {
    var opponents = this.get('model');
    return opponents.filterBy('status', 'pending').sortBy('name');
  }.property('model.@each.status', 'clock.pulse'),

  friendOpponents: function() {
    var opponents = this.get('model');
    return opponents.filterBy('status', 'friend').sortBy('name');
  }.property('model.@each.status', 'clock.pulse')
});
