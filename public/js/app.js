'use strict';

// CONFIG TODO MOVE SOMEWHERE SEPARATE
var SERVER_URL = 'http://localhost:8000';
var REALTIME_SERVER_URL = 'http://localhost:8080';
var USERS_ROUTE = SERVER_URL + '/users';
var SELF_ROUTE = USERS_ROUTE + '?me';
var POKES_ROUTE = SERVER_URL + '/pokes';
var LOGIN_ROUTE = SERVER_URL + '/login';
var PRIMUS_ROUTE = REALTIME_SERVER_URL;
var CALLBACK_NAME = 'pokecb';

var DEFAULT_AVATAR = 'http://www.gravatar.com/avatar/00000000000000000000000000000000';

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
    return new Ember.RSVP.Promise(function(resolve, reject) {
      $.ajax(
        {
          dataType: 'jsonp',
          method: 'POST',
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
          window.localStorage.setItem('email', options.identification); // FIXME
          resolve();
        })
        .fail(function(a, b, c) {
          alert('failed login :(');
          console.log(a, b, c);
          reject('failed');
        });
    });
  },
  invalidate: function() {
    return new Ember.RSVP.Promise(function(resolve) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('email');
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
        crossOriginWhitelist: [SERVER_URL],
        authorizerFactory: 'authorizer:custom'
      }
    );
  }
});

Ember.Handlebars.registerBoundHelper('dateFormat', function(date, format) {
  return moment(date).format(format);
});

Ember.Handlebars.registerBoundHelper('relativeDateFormat', function(date) {
  return moment(date).fromNow();
});

window.PokeGame = Ember.Application.create({
  LOG_TRANSITIONS: true
});

// PokeGame.ApplicationSerializer = DS.LSSerializer.extend();
// PokeGame.ApplicationAdapter = DS.LSAdapter.extend({
//   namespace: 'pokeNS'
// });
