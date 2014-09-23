'use strict';
NopeGame.InvitedOpponentsController = Ember.ArrayController.extend({
  sortProperties: ['name'],
  sortAscending: true,
  invitedOpponents: function() {
    return this.get('model').filterBy('status', 'invited');
  }.property('model.@each.status')
});
