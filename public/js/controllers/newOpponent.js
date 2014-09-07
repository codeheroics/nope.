'use strict';
NopeGame.NewOpponentController = Ember.ObjectController.extend({
  actions: {
    addOpponent: function(email) {
      NopeGame.serverManager.addOpponent(email).then(function() {
        this.transitionToRoute('index');
      }.bind(this));
    }
  },
  content: {}
});
