PokeGame.Poke = Ember.Model.extend({
  id:               Ember.attr(), // string
  opponent:         Ember.belongsTo('PokeGame.Opponent', { key: 'opponentId' }),
  isReceived:       Ember.attr(), // boolean
  time:             Ember.attr(Number),
  date:             function() {return new Date(this.get('time')); }.property('date'),
  timeDiff:         Ember.attr(Number)
});

PokeGame.Poke.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});
