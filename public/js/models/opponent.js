PokeGame.Opponent = Ember.Model.extend({
  id:             Ember.attr(), // string
  email:          Ember.attr(), // string
  name:           Ember.attr(), // string
  avatar:         Ember.attr(), // string
  timeFor:        Ember.attr(Number), // { defaultValue: 0 }),
  timeAgainst:    Ember.attr(Number), // { defaultValue: 0 }),
  pokes:          Ember.hasMany('PokeGame.Poke', { key: 'pokesIds' }),
  pokesCpt:       Ember.attr(Number),
  lastPokeTime:   Ember.attr(Number),
  isScoring:      Ember.attr(), // boolean
  status:         Ember.attr() // string : "friend", "pending", "blocked"
});

PokeGame.Opponent.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});
