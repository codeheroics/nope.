PokeGame.User = Ember.Model.extend({
  id:             Ember.attr(), // string
  name:           Ember.attr(), // string
  email:          Ember.attr(), // string
  avatar:         Ember.attr(), // string
  totalScore:     Ember.attr(Number), // { defaultValue: 0 }
  totalPokes:     Ember.attr(Number) // { defaultValue: 0 }
});

PokeGame.User.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});

/*
PokeGame.User.FIXTURES = [{
  id:             1,
  email:          'hugo@agbonon.fr',
  name:           'Hugo',
  avatar:         'http://agbonon.fr/img/Hugo_Agbonon.jpg',
  scoreFor:       4200,
  scoreAgainst:   4200,
  pokes:          [],
  isScoring:      false
}];
*/
