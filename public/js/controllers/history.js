'use strict';
NopeGame.HistoryController = Ember.ArrayController.extend({
  sortProperties: ['time'],
  sortAscending: false,
  nopes: function() {
    return this.toArray().slice(0, NOPES_HISTORY_LENGTH);
  }.property('model.@each'),
});
