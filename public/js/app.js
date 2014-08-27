'use strict';

var protocol = 'http://'; // FIXME
var hostname = window.location.hostname;
var isDev = window.location.origin.indexOf('localhost') !== -1;
var SERVER_URL = window.location.origin;
var REALTIME_SERVER_URL = isDev ? window.location.protocol + '//' + window.location.hostname + ':8080' : window.location.origin + '/ws';

var USERS_ROUTE = SERVER_URL + '/users';
var SELF_ROUTE = USERS_ROUTE + '?me';
var POKES_ROUTE = SERVER_URL + '/pokes';
var LOGIN_ROUTE = SERVER_URL + '/login';
var SIGNUP_ROUTE = SERVER_URL + '/signup';
var PRIMUS_ROUTE = REALTIME_SERVER_URL;
var CALLBACK_NAME = 'nopecb';

var DEFAULT_AVATAR = 'http://www.gravatar.com/avatar/00000000000000000000000000000000';
var GRAVATAR_BASE = 'http://www.gravatar.com/avatar/';

var PENDING_USERS_KEY = 'pendingUsers';
var IGNORED_USERS_KEY = 'ignoredUsers';

toastr.options = {
  showDuration: 300,
  hideDuration: 300,
  timeOut: 2000,
  positionClass: 'toast-bottom-right',
};

function generateGravatar(email) {
  return GRAVATAR_BASE + md5(email) + '?d=retro';
}

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
    window.localStorage.clear();
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
          toastr.error('Incorrect password. Please try again.');
          console.log(a, b, c);
          reject('failed');
        });
    });
  },
  invalidate: function() {
    return new Ember.RSVP.Promise(function(resolve) {
      window.localStorage.clear();
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

Ember.View.reopen({
  didInsertElement : function() {
    this._super();
    Ember.run.scheduleOnce('afterRender', this, activateBorderMenus);
  }
});

window.PokeGame = Ember.Application.create({
  LOG_TRANSITIONS: true
});
