'use strict';
NopeGame.OpponentNopesController = Ember.ObjectController.extend({
  actions: {
    nope: function(opponent) {
      var endLoading = function() {
        this.set('isLoading', false);
      }.bind(this);

      this.set('isLoading', true);
      NopeGame.serverManager.nopeAt(opponent.get('email'))
      .then(endLoading, endLoading);
    },

    ignore: function(opponent) {
      NopeGame.serverManager.ignoreOpponent(opponent.get('email'))
      .then(function() {
        this.transitionToRoute('opponents');
      }.bind(this));
    },

    concede: function(opponent) {
      NopeGame.serverManager.concedeRound(opponent);
    },

    requestTruce: function(opponent) {
      NopeGame.serverManager.requestTruce(opponent);
    },

    breakTruce: function(opponent) {
      NopeGame.serverManager.breakTruce(opponent);
    }
  },

  isLoading: false,

  myAvatar: function() {
    return localStorage.getItem('avatar');
  }.property('myAvatar'),

  isWinning: function() {
    return this.get('computedTimeFor') > this.get('computedTimeAgainst');
  }.property('computedTimeFor', 'computedTimeAgainst', 'clock.pulse'),

  canBreakTruce: function() {
    return this.get('model.inTruceUntil') < Date.now();
  }.property('model.inTruceUntil', 'clock.pulse'),

  timeRemainingInTruce: function() {
    return this.get('model.inTruceUntil') - Date.now();
  }.property('model.inTruceUntil', 'clock.pulse'),

  roundNumber: function() {
    return (this.get('victories') || 0) + (this.get('defeats') || 0) + 1;
  }.property('victories', 'defeats'),

  canConcede: function() {
    return this.get('isScoring') &&
      this.get('computedTimeFor') - this.get('computedTimeAgainst') > 24 * 60 * 60 * 1000; // 1 day
  }.property('isScoring', 'clock.pulse', 'computedTimeAgainst', 'computedTimeFor')
});
