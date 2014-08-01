'use strict';
PokeGame.NewOpponentController = Ember.ObjectController.extend({
  actions: {
    addOpponent: function(email) {
      PokeGame.serverManager.addOpponent(email).then(function() {
        this.transitionToRoute('index');
      }.bind(this));
    }
  },
  content: {}
});
