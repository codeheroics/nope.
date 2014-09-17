'use strict';

NopeGame.LoginController = Ember.Controller.extend(
  Ember.SimpleAuth.LoginControllerMixin,
  {
    authenticatorFactory: 'authenticator:custom'
  }
);
