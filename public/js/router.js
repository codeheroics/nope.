/* global NopeGame */
/* global Ember */
'use strict';

NopeGame.Router.reopen({
  rootURL: '/app.html'
});

NopeGame.Router.map(function() {
  this.resource('index', { path: '/'  });
  this.resource('login', { path: '/login' });
  this.resource('signup', { path: '/signup' });
  this.resource('opponentNopes', { path: '/opponents/:opponent_id/nopes' });
  this.resource('opponents', { path: '/opponents' });
  this.resource('ignoredOpponents', { path: '/opponents?ignored' });
  this.resource('newOpponent', { path: '/opponents/new' });
  this.resource('history', { path: '/history' });
  this.resource('profile', { path: '/profile' });
  this.resource('help', { path: '/help' });
  this.resource('about', { path: '/about' });
});

function createServerManager() {
  if (NopeGame.serverManager) return;
  NopeGame.serverManager = NopeGame.NopeServerManager.create();
}


NopeGame.ApplicationRoute = Ember.Route.extend(
  Ember.SimpleAuth.ApplicationRouteMixin, {
    actions: {
      sessionAuthenticationSucceeded: function(transition, queryParams) {
        createServerManager();
        this._super(transition, queryParams);
      }
    }
  }
);

NopeGame.AuthenticatedRouteMixin = Ember.Mixin.create(
  Ember.SimpleAuth.AuthenticatedRouteMixin, {
    beforeModel: function(transition, queryParams) {
      this._super(transition, queryParams);
      if (this.get('session').get('isAuthenticated')) {
        createServerManager();

        // Load everything - without this, errors pop, single instances can't be found...
        NopeGame.User.find();
        NopeGame.Opponent.find();
        NopeGame.Nope.find();

        NopeGame.serverManager.updateSelfInfos();
      }
    }
  }
);

NopeGame.LoginRoute = Ember.Route.extend(
  {
    beforeModel: function(params) {
      if (this.get('session').get('isAuthenticated')) return this.transitionTo('index');


      if (params.queryParams.confirmed) {
        toastr.success(
          'You have successfully completed your registration! You can now login!',
          'Welcome!',
          {timeOut: 30000}
        );
      }
    }
  }
);

NopeGame.IndexRoute = Ember.Route.extend(
  NopeGame.AuthenticatedRouteMixin,
  {
    model: function() {
      return NopeGame.Opponent.find();
    },
  }
);

NopeGame.HistoryRoute = Ember.Route.extend(
  NopeGame.AuthenticatedRouteMixin,
  {
    model: function() {
      return NopeGame.Nope.find();
    }
  }
);

NopeGame.ProfileRoute = Ember.Route.extend(
  NopeGame.AuthenticatedRouteMixin,
  {
    model: function() {
      var user = NopeGame.User.find(1);
      if (user.isLoaded) return user;

      NopeGame.serverManager.updateSelfInfos();
    }
  }
);

NopeGame.OpponentNopesRoute = Ember.Route.extend(
  NopeGame.AuthenticatedRouteMixin,
  {
    model: function(params) {
      return NopeGame.Opponent.find(params.opponent_id);
    }
  }
);

NopeGame.OpponentsRoute = Ember.Route.extend(
  NopeGame.AuthenticatedRouteMixin,
  {
    model: function() {
      return NopeGame.Opponent.findQuery({status: 'friend'});
    }
  }
);

NopeGame.IgnoredOpponentsRoute = Ember.Route.extend(
  NopeGame.AuthenticatedRouteMixin,
  {
    model: function() {
      return NopeGame.Opponent.findQuery({status: 'ignored'});
    }
  }
);

NopeGame.NewOpponentRoute = Ember.Route.extend(
  NopeGame.AuthenticatedRouteMixin
);
