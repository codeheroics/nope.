'use strict';

var isDev = window.location.origin.indexOf('localhost') !== -1;
var SERVER_URL = window.location.origin;
var REALTIME_SERVER_URL = isDev ? 'http://localhost:8080' : window.location.origin + '/ws'; //FIXME

var USERS_ROUTE = SERVER_URL + '/users';
var SELF_ROUTE = USERS_ROUTE + '?me';
var NOPES_ROUTE = SERVER_URL + '/nopes';
var LOGIN_ROUTE = SERVER_URL + '/login';
var SIGNUP_ROUTE = SERVER_URL + '/signup';
var FORGOTTEN_PASSWORD_ROUTE = SERVER_URL + '/forgotten-password';
var PASSWORD_RESET_ROUTE = SERVER_URL + '/password-reset';

var PRIMUS_ROUTE = REALTIME_SERVER_URL;
var CALLBACK_NAME = 'nopecb';

var GRAVATAR_BASE = 'https://www.gravatar.com/avatar/';

var PENDING_USERS_KEY = 'pendingUsers';
var IGNORED_USERS_KEY = 'ignoredUsers';

var NOPES_HISTORY_LENGTH = 25;

$.support.cors = true;

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
          resolve();
        })
        .fail(function(xhr) {
          if (xhr.status === 401) {
            toastr.error('Please try again.', 'Incorrect password', {timeOut: 5000});
          } else if (xhr.status === 403) {
            if (xhr.responseJSON.title === 'Unconfirmed') {
              toastr.error('Check your mail for a confirmation link!', 'Unconfirmed account', {timeOut: 10000});
            } else if (xhr.responseJSON.title === 'Too many requests') {
              toastr.error('Your account is currently locked after too many failed login attempts, ' +
                ' please try again in a few minutes.', 'Locked account', {timeOut: 10000});
            } else {
              toastr.error('Please try again in a few minutes', 'Identification error', {timeOut: 10000});
            }
          } else {
            toastr.error('Please try again in a few minutes', 'Server error', {timeOut: 10000});
          }
          reject();
        });
    });
  },
  invalidate: function() {
    return new Ember.RSVP.Promise(function(resolve) {
      window.localStorage.clear();
      if (NopeGame.serverManager) {
        NopeGame.serverManager.endPrimus();
      }
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

var ClockService = Ember.Object.extend({
  pulse: Ember.computed.oneWay('_seconds').readOnly(),
  tick: function () {
    Ember.run.later(function () {
      var seconds = this.get('_seconds');
      if (typeof seconds === 'number') {
        this.set('_seconds', seconds + 1);
      }
    }.bind(this), 1000);
  }.observes('_seconds').on('init'),
  _seconds: 0,
});

Ember.Application.initializer({
  name: 'clockServiceInitializer',
  initialize: function(container, application) {
    container.register('clock:service', ClockService);
    application.inject('controller:index', 'clock', 'clock:service');
    application.inject('controller:opponents', 'clock', 'clock:service');
    application.inject('controller:opponentNopes', 'clock', 'clock:service');
    application.inject('controller:history', 'clock', 'clock:service');
  }
});

Ember.Handlebars.registerBoundHelper('dateFormat', function(time, format) {
  return moment(time).format(format);
});

Ember.Handlebars.registerBoundHelper('relativeDateFormat', function(time) {
  var now = Date.now();
  return moment(time > now ? now : time).fromNow();
});

(function() {
  var durationHelper = function(milliseconds) {
    milliseconds = Math.abs(milliseconds);
    var units = ['years', 'days', 'hours', 'minutes', 'seconds'];

    return units.reduce(function(previousValue, unit) {
      var unitValue = moment.duration(milliseconds)[unit]();

      if (unitValue === 0) return previousValue;
      return previousValue + (previousValue === '' ?  '' : ', ') + unitValue + ' ' + unit;
    }, '').replace(/,([^,]*)$/,' and'+'$1') || 'less than a second';
  };

  Ember.Handlebars.registerBoundHelper('duration', durationHelper);
  Ember.Handlebars.registerBoundHelper('winningDuration', function(myTime, opponentTime) {
    if (!myTime && !opponentTime) return;
    var milliseconds = (myTime || 0) - (opponentTime || 0);
    var winningStatus = milliseconds > 0 ? 'wins' : 'loses';
    return winningStatus + ' by ' + durationHelper(milliseconds);
  });
})();

Ember.View.reopen({
  didInsertElement : function() {
    this._super();
    Ember.run.scheduleOnce('afterRender', this, activateBorderMenus);
  }
});

window.NopeGame = Ember.Application.create();
