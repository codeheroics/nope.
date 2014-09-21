'use strict';
NopeGame.OpponentsController = Ember.ArrayController.extend({
  sortProperties: ['name'],
  sortAscending: true,
  singleOpponent: function() {
    return this.toArray().length === 1;
  }.property('model.@each')
});
