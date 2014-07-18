/* global PokeGame */
/* global Ember */
'use strict';

PokeGame.Router.map(function() {
  this.resource('index', { path: '/'  });
  this.resource('login', { path: '/login' });
  this.resource('signup', { path: '/signup' });
  this.resource('opponentPokes', { path: '/opponents/:opponent_id/pokes' });
  this.resource('opponents', { path: '/opponents' });
  this.resource('history', { path: '/history' });
  this.resource('profile', { path: '/profile' });
  this.resource('help', { path: '/help' });
  this.resource('about', { path: '/about' });
});

function connectToPrimus() {
    if (PokeGame.serverManager || PokeGame.realTimeManager) return;
    PokeGame.serverManager = PokeGame.PokeServerManager.create();
    PokeGame.realTimeManager = PokeGame.RealTimeManager.create();
}


PokeGame.ApplicationRoute = Ember.Route.extend(
  Ember.SimpleAuth.ApplicationRouteMixin, {
    actions: {
      sessionAuthenticationSucceeded: function(transition, queryParams) {
        connectToPrimus();
        this._super(transition, queryParams);
      }
    }
  }
);

PokeGame.AuthenticatedRouteMixin = Ember.Mixin.create(
  Ember.SimpleAuth.AuthenticatedRouteMixin, {
    beforeModel: function(transition, queryParams) {
      connectToPrimus();
      this._super(transition, queryParams);
    }
  }
);

PokeGame.IndexRoute = Ember.Route.extend(
  PokeGame.AuthenticatedRouteMixin,
  {
    model: function() {
      PokeGame.serverManager.getPokes().then(function() {
        return PokeGame.Opponent.find();
      });
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
      return PokeGame.Opponent.find();
    }
  }
);
