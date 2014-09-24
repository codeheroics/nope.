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
    }
  },

  isLoading: false,

  timeFor: function() {
    return this.get('model.timeFor') +
    (this.get('isScoring') ? this.get('timeDiffSinceLast') : 0);
  }.property('model.timeFor', 'model.isScoring', 'timeDiffSinceLast'),

  timeAgainst: function() {
    return this.get('model.timeAgainst') +
    (this.get('isScoring') ? 0 : this.get('timeDiffSinceLast'));
  }.property('model.timeAgainst', 'model.isScoring', 'timeDiffSinceLast'),

  myAvatar: function() {
    return NopeGame.User.find(1).get('avatar');
  }.property('myAvatar'),

  isWinning: function() {
    var timeFor = this.get('timeFor');
    var timeAgainst = this.get('timeAgainst');
    return timeFor > timeAgainst;
  }.property('timeFor', 'timeAgainst'),

  timeDiff: function() {
    var timeFor = this.get('model.timeFor');
    var timeAgainst = this.get('model.timeAgainst');
    return Math.abs(
      timeFor - timeAgainst +
        this.get('timeDiffSinceLast') * (this.get('isScoring') ? 1 : -1)
    );
  }.property('model.timeFor', 'model.timeAgainst', 'clock.pulse'),

  timeDiffSinceLast: function() {
    var lastNopeTime = this.get('model.lastNopeTime');
    var now = Date.now();
    if (!lastNopeTime) {
      // Prevent showing ludicrous durations without actually saving anything
      this.set('model.lastNopeTime', now);
      lastNopeTime = now;
    }
    return now - lastNopeTime - (
      parseInt(window.localStorage.getItem('serverTimeDiff') || 0, 10)
    );
  }.property('model.lastNopeTime', 'clock.pulse')
});
