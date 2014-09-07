NopeGame.Opponent = Ember.Model.extend({
  id:             Ember.attr(), // string
  email:          Ember.attr(), // string
  name:           Ember.attr(), // string
  avatar:         Ember.attr(), // string
  timeFor:        Ember.attr(Number), // { defaultValue: 0 }),
  timeAgainst:    Ember.attr(Number), // { defaultValue: 0 }),
  nopes:          Ember.hasMany('NopeGame.Nope', { key: 'nopesIds' }),
  nopesCpt:       Ember.attr(Number),
  lastNopeTime:   Ember.attr(Number),
  isScoring:      Ember.attr(), // boolean
  status:         Ember.attr() // string : "friend", "pending", "blocked"
});

NopeGame.Opponent.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});
