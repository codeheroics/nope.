/* global PokeGame */
/* global Ember */
'use strict';

PokeGame.Router.reopen({
  rootURL: '/app.html'
});

PokeGame.Router.map(function() {
  this.resource('index', { path: '/'  });
  this.resource('login', { path: '/login' });
  this.resource('signup', { path: '/signup' });
  this.resource('opponentPokes', { path: '/opponents/:opponent_id/pokes' });
  this.resource('opponents', { path: '/opponents' });
  this.resource('newOpponent', { path: '/opponents/new' });
  this.resource('history', { path: '/history' });
  this.resource('profile', { path: '/profile' });
  this.resource('help', { path: '/help' });
  this.resource('about', { path: '/about' });
});

function createServerManager() {
  if (PokeGame.serverManager) return;
  PokeGame.serverManager = PokeGame.PokeServerManager.create();
}


PokeGame.ApplicationRoute = Ember.Route.extend(
  Ember.SimpleAuth.ApplicationRouteMixin, {
    actions: {
      sessionAuthenticationSucceeded: function(transition, queryParams) {
        createServerManager();
        this._super(transition, queryParams);
      }
    }
  }
);

PokeGame.AuthenticatedRouteMixin = Ember.Mixin.create(
  Ember.SimpleAuth.AuthenticatedRouteMixin, {
    beforeModel: function(transition, queryParams) {
      this._super(transition, queryParams);
      if (this.get('session').get('isAuthenticated')) {
        createServerManager();
        PokeGame.serverManager.updateSelfInfos();
      }
    }
  }
);

PokeGame.IndexRoute = Ember.Route.extend(
  PokeGame.AuthenticatedRouteMixin,
  {
    model: function() {
      return PokeGame.Opponent.find();
    },
  }
);

PokeGame.HistoryRoute = Ember.Route.extend(
  PokeGame.AuthenticatedRouteMixin,
  {
    model: function() {
      return PokeGame.Poke.find();
    }
  }
);

PokeGame.ProfileRoute = Ember.Route.extend(
  PokeGame.AuthenticatedRouteMixin,
  {
    model: function() {
      var user = PokeGame.User.find(1);
      if (user.isLoaded) return user;

      PokeGame.serverManager.updateSelfInfos();
    }
  }
);

PokeGame.OpponentPokesRoute = Ember.Route.extend(
  PokeGame.AuthenticatedRouteMixin,
  {
    model: function(params) {
      return PokeGame.Opponent.find(params.opponent_id);
    }
  }
);

PokeGame.OpponentsRoute = Ember.Route.extend(
  PokeGame.AuthenticatedRouteMixin,
  {
    model: function() {
      return PokeGame.Opponent.findQuery({status: 'friend'});
    }
  }
);

PokeGame.NewOpponentRoute = Ember.Route.extend(
  PokeGame.AuthenticatedRouteMixin
);
