PokeGame.SignupController = Ember.ObjectController.extend({
  message: function() {
    return 'bouh';
  }.property('message'),
  csrf: function() {
    return 'bouh';
  }.property('csrf')
});
