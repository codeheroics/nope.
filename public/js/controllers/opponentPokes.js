'use strict';
NopeGame.OpponentNopesController = Ember.ObjectController.extend({
  actions: {
    nope: function(opponent) {
      NopeGame.serverManager.nopeAt(opponent.get('email'));
    },

    ignore: function(opponent) {
      NopeGame.serverManager.ignoreOpponent(opponent.get('email'))
      .then(function() {
        this.transitionToRoute('opponents');
      }.bind(this));
    }
  },

  myAvatar: function() {
    return NopeGame.User.find(1).get('avatar');
  }.property('myAvatar'),

  isWinning: function() {
    var timeFor = this.get('model.timeFor');
    var timeAgainst = this.get('model.timeAgainst');
    return timeFor > timeAgainst;
  }.property('model.timeFor', 'model.timeAgainst'),
});
