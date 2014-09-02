'use strict';
PokeGame.User = Ember.Model.extend({
  id:             Ember.attr(), // string
  name:           Ember.attr(), // string
  email:          Ember.attr(), // string
  avatar:         Ember.attr(), // string
  timePoking:     Ember.attr(Number), // { defaultValue: 0 }
  totalPokes:     Ember.attr(Number), // { defaultValue: 0 }
  achievements:   Ember.attr(Array, { defaultValue: [] })
});

PokeGame.User.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});
