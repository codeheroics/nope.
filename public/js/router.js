/* global PokeGame */
/* global Ember */
'use strict';

PokeGame.Router.map(function() {
  this.resource('index', { path: '/' });
  this.resource('login', { path: '/login'});
  this.resource('signup', { path: '/signup'});
  this.resource('opponentPokes', { path: '/opponents/:opponent_id/pokes' });
  this.resource('opponents', { path: '/opponents' });
  this.resource('history', { path: '/history'});
  this.resource('profile', { path: '/profile'});
  this.resource('help', { path: '/help'});
  this.resource('about', { path: '/about'});
});

PokeGame.ApplicationRoute = Ember.Route.extend(
  Ember.SimpleAuth.ApplicationRouteMixin
);

PokeGame.IndexRoute = Ember.Route.extend(
  Ember.SimpleAuth.AuthenticatedRouteMixin,
  {
    model: function() {
      if (Ember.isNone(this.get('pokeServerManager'))) {
        this.set('pokeServerManager', PokeGame.PokeServerManager.create());
      }
        // return PokeGame.Opponent.find();

      return this.get('pokeServerManager').getPokes().then(function() {
        return PokeGame.Opponent.find();
      });
    },
  }
);

PokeGame.HistoryRoute = Ember.Route.extend(
  Ember.SimpleAuth.AuthenticatedRouteMixin,
  {
    model: function() {
      return PokeGame.Poke.find();
    }
  }
);

PokeGame.ProfileRoute = Ember.Route.extend(
  Ember.SimpleAuth.AuthenticatedRouteMixin,
  {
    model: function() {
      var user = PokeGame.User.find(1);
      if (user.isLoaded) return user;

      var pokeServerManager = PokeGame.PokeServerManager.create();
      return pokeServerManager.updateSelfInfos();
    }
  }
);

PokeGame.OpponentPokesRoute = Ember.Route.extend(
  Ember.SimpleAuth.AuthenticatedRouteMixin,
  {
    model: function(params) {
      return PokeGame.Opponent.find(params.opponent_id);
    }
  }
);

PokeGame.OpponentsRoute = Ember.Route.extend(
  Ember.SimpleAuth.AuthenticatedRouteMixin,
  {
    model: function() {
      return PokeGame.Opponent.find();
    }
  }
);
