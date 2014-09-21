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

  myAvatar: function() {
    return NopeGame.User.find(1).get('avatar');
  }.property('myAvatar'),

  isWinning: function() {
    var timeFor = this.get('model.timeFor');
    var timeAgainst = this.get('model.timeAgainst');
    return timeFor > timeAgainst;
  }.property('model.timeFor', 'model.timeAgainst'),

  timeDiff: function() {
    var timeFor = this.get('model.timeFor');
    var timeAgainst = this.get('model.timeAgainst');
    return Math.abs(timeFor - timeAgainst);
  }.property('model.timeFor', 'model.timeAgainst'),

  timeDiffSinceLast: function() {
    var lastNopeTime = this.get('model.lastNopeTime');
    var now = Date.now();
    return now - lastNopeTime;
  }.property('model.lastNopeTime', 'clock.pulse')
});
