'use strict';
NopeGame.Nope = Ember.Model.extend({
  id:               Ember.attr(), // string
  opponent:         Ember.belongsTo('NopeGame.Opponent', { key: 'opponentId' }),
  isReceived:       Ember.attr(), // boolean
  time:             Ember.attr(Number),
  date:             function() {return new Date(this.get('time')); }.property('date'),
  timeDiff:         Ember.attr(Number)
});

NopeGame.Nope.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});
