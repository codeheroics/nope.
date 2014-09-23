'use strict';
NopeGame.InvitedOpponentsController = Ember.ArrayController.extend({
  sortProperties: ['name'],
  sortAscending: true,
  invitedOpponents: function() {
    return this.get('model').filterBy('status', 'invited').sortBy('name');
  }.property('model.@each.status')
});
