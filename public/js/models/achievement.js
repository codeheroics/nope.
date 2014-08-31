PokeGame.Achievement = Ember.Model.extend({
  id:             Ember.attr(Number),
  title:          Ember.attr(), // string
  description:    Ember.attr(), // string
  unlocked:       Ember.attr() // boolean
});

PokeGame.Achievement.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});
