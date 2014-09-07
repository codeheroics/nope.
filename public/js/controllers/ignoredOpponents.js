'use strict';
NopeGame.IgnoredOpponentsController = Ember.ArrayController.extend({
  actions: {
    unIgnoreOpponent: function(model) {
      NopeGame.serverManager.unIgnoreOpponent(model)
      .then(function() {
        // FIXME for now transitionning to route because I have no idea how to live update the view
        // (will be problematic on multi device use, needs to be fixed)
        this.transitionToRoute('opponents');
      }.bind(this));
    }
  },
  sortProperties: ['name'],
  sortAscending: true
});
