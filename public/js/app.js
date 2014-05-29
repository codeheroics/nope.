window.PokeGame = Ember.Application.create({
  LOG_TRANSITIONS: true
});

PokeGame.ApplicationAdapter = DS.FixtureAdapter.extend();
