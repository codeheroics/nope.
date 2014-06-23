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
      var opponents = PokeGame.Opponent.find();
      console.log(opponents);
      return PokeGame.Opponent.find();
    },
    setupController: function(controller, opponents) {
      controller.set('model', opponents);
      if (Ember.isNone(this.get('pokeServerManager'))) {
        this.set('pokeServerManager', PokeGame.PokeServerManager.create());
      }
      this.get('pokeServerManager').getPokes();
    }
  }
);

PokeGame.HistoryRoute = Ember.Route.extend(
  Ember.SimpleAuth.AuthenticatedRouteMixin,
  {
    model: function() {
      console.log(PokeGame.Poke.find());
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
      console.log(PokeGame.Opponent.find(params.opponent_id))
      return PokeGame.Opponent.find(params.opponent_id);
    }
  }
);

PokeGame.OpponentsRoute = Ember.Route.extend(
  Ember.SimpleAuth.AuthenticatedRouteMixin,
  {
    model: function() {
      console.log(PokeGame.Opponent.find())
      return PokeGame.Opponent.find();
    }
  }
);
