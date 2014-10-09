'use strict';
NopeGame.Nope = Ember.Model.extend({
  id:               Ember.attr(), // string
  opponent:         Ember.belongsTo('NopeGame.Opponent', { key: 'opponentId' }),
  isReceived:       Ember.attr(), // boolean
  time:             Ember.attr(Number),
  computedTime:     function() { // take in account the time diff with the server @see opponent.js
    return this.get('time') - (localStorage.getItem('serverTimeDiff') || 0);
  }.property('time'),
  timeDiff:         Ember.attr(Number)
});

NopeGame.Nope.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});
