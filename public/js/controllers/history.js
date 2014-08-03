'use strict';
PokeGame.HistoryController = Ember.ArrayController.extend({
  sortProperties: ['date'],
  sortAscending: false,
  pokes: function() {
    return this.toArray().slice(0, 25);
  }.property('model.@each'),
});
