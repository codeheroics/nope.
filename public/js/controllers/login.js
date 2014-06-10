'use strict';

PokeGame.LoginController = Ember.Controller.extend(
  Ember.SimpleAuth.LoginControllerMixin,
  {
    authenticatorFactory: 'authenticator:custom',
    message: function() {
      return 'bouh';
    }.property('message'),
    csrf: function() {
      return 'bouh';
    }.property('csrf')
  }
);
