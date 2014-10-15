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

    declareVictory: function(opponent) {
      NopeGame.serverManager.declareVictory(opponent);
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
    return this.get('model.computedInTruceUntil') < Date.now();
  }.property('model.computedInTruceUntil', 'clock.pulse'),

  timeRemainingInTruce: function() {
    return this.get('model.computedInTruceUntil') - Date.now();
  }.property('model.computedInTruceUntil', 'clock.pulse'),

  roundNumber: function() {
    return (this.get('model.victories') || 0) + (this.get('model.defeats') || 0) + 1;
  }.property('model.victories', 'model.defeats'),

  canConcede: function() {
    return this.get('isScoring') &&
      this.get('computedTimeFor') - this.get('computedTimeAgainst') > 24 * 60 * 60 * 1000; // 1 day
  }.property('isScoring', 'clock.pulse', 'computedTimeAgainst', 'computedTimeFor'),

  canWin: function() {
    return this.get('isScoring') &&
      this.get('computedTimeAgainst') - this.get('computedTimeFor') > 48 * 60 * 60 * 1000; // 2 days
  }.property('isScoring', 'clock.pulse', 'computedTimeAgainst', 'computedTimeFor'),


  canEndRound: function() {
    return this.get('canConcede') || this.get('canWin');
  }.property('clock.pulse', 'canConcede', 'canWin')
});
