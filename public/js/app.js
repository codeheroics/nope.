/* global Ember */
/* global DS */
'use strict';

var CustomAuthenticator = Ember.SimpleAuth.Authenticators.Base.extend({
  restore: function(data) {

  },
  authenticate: function(options) {
    return Ember.RSVP.Promise(function(resolve, reject) {
      $.ajax({
        dataType: 'jsonp',
        data: {
          email: options.email,
          password: options.password,
          jsonp: CALLBACK_NAME,
          url: LOGIN_ROUTE
        }
        .done(resolve)
        .fail(function(a, b, c) {
          alert('failed login');
          console.log(a, b, c);
          reject('failed');
        })
      });
    });
  },
  invalidate: function() {

  }
});

Ember.Application.initializer({
  name: 'authentication',
  initialize: function(container, application) {
    container.register('authenticator:custom', CustomAuthenticator);
    Ember.SimpleAuth.setup(container, application);
  }
});

var PokeGame = Ember.Application.create({
  LOG_TRANSITIONS: true
});

PokeGame.ApplicationAdapter = DS.FixtureAdapter.extend();
