'use strict';
NopeGame.ProfileController = Ember.ObjectController.extend({
  achievements: function() {
    var unsortedAchievements = this.get('model.achievements').toArray();
    return NopeGame.achievementsManager.achievementsOrder.map(function(id) {
      return unsortedAchievements[id];
    });
  }.property('model.achievements')
});
