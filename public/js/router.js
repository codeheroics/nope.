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

PokeGame.IndexRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('opponent');
  },
  setupController: function(controller, opponents) {
    controller.set('model', opponents);
    if (Ember.isNone(this.get('pokeServerManager'))) {
      this.set('pokeServerManager', PokeGame.PokeServerManager.create());
    }
    this.get('pokeServerManager').getPokes(this.store);
  }
});

PokeGame.HistoryRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('poke');
  }
});

PokeGame.ProfileRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('user', 1);
  }
});

PokeGame.OpponentPokesRoute = Ember.Route.extend({
  model: function(params) {
    return this.store.find('opponent', params.opponent_id);
  }
});

PokeGame.OpponentsRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('opponent');
  }
});
