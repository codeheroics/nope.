/* global Ember */
/* global DS */
'use strict';

var CustomAuthenticator = Ember.SimpleAuth.Authenticators.Base.extend({
  restore: function(data) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      var storedToken = window.localStorage.getItem('token');
      if (!storedToken) return reject();

      $.ajax(
        {
          dataType: 'jsonp',
          method: 'get',
          jsonp: CALLBACK_NAME,
          url: LOGIN_ROUTE
        }
      )
        .done(resolve)
        .fail(reject);
    });
  },
  authenticate: function(options) {
    console.log('options', options);
    return new Ember.RSVP.Promise(function(resolve, reject) {
      $.ajax(
        {
          dataType: 'jsonp',
          method: 'post',
          jsonp: CALLBACK_NAME,
          url: LOGIN_ROUTE,
          data: {
            email: options.identification,
            password: options.password
          }
        }
      )
        .done(function(data) {
          window.localStorage.setItem('token', data);
          resolve();
        })
        .fail(function(a, b, c) {
          alert('failed login');
          console.log(a, b, c);
          reject('failed');
        });
    });
  },
  invalidate: function() {
    return new Ember.RSVP.Promise(function(resolve) {
      window.localStorage.removeItem('token');
      resolve();
    });
  }
});

var CustomAuthorizer = Ember.SimpleAuth.Authorizers.Base.extend({
  authorize: function(jqXHR, requestOptions) {
    if (!requestOptions.headers) {
      requestOptions.headers = {};
    }
    requestOptions.headers['x-access-token'] = window.localStorage.getItem('token');
  }
});

Ember.Application.initializer({
  name: 'authentication',
  initialize: function(container, application) {
    container.register('authenticator:custom', CustomAuthenticator);
    container.register('authorizer:custom', CustomAuthorizer);
    Ember.SimpleAuth.setup(
      container,
      application,
      {
        crossOriginWhitelist: ['http://localhost:8000'],
        authorizerFactory: 'authorizer:custom'
      }
    );
  }
});

var PokeGame = Ember.Application.create({
  LOG_TRANSITIONS: true
});

PokeGame.ApplicationAdapter = DS.FixtureAdapter.extend();
