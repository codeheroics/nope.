'use strict';

PokeGame.LoginController = Ember.Controller.extend(
  Ember.SimpleAuth.LoginControllerMixin,
  {
    authenticatorFactory: 'ember-simple-auth-authenticator:oauth2-password-grant',
    message: function() {
      return 'bouh';
    }.property('message'),
    csrf: function() {
      return 'bouh';
    }.property('csrf')
  }
);

PokeGame.LoginController = Ember.ObjectController.extend({
});
