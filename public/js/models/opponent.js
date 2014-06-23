PokeGame.Opponent = Ember.Model.extend({
  id:             Ember.attr(), // string
  email:          Ember.attr(), // string
  name:           Ember.attr(), // string
  avatar:         Ember.attr(), // string
  scoreFor:       Ember.attr(Number), // { defaultValue: 0 }),
  scoreAgainst:   Ember.attr(Number), // { defaultValue: 0 }),
  pokes:          Ember.hasMany('PokeGame.Poke', { key: 'pokesIds', embedded: true }),
  isScoring:      Ember.attr() // boolean
});

PokeGame.Opponent.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});

/*
PokeGame.Opponent.FIXTURES = [
  {
    id:             'eclaerhout@gmail.com',
    email:          'eclaerhout@gmail.com',
    name:           'Emilie',
    avatar:         'http://agbonon.fr/img/Hugo_Agbonon.jpg',
    scoreFor:       4242,
    scoreAgainst:   1242,
    pokes:          [
      '1402529967087eclaerhout@gmail.com',
      '1402530067256eclaerhout@gmail.com',
      '1402530099444eclaerhout@gmail.com'
    ],
    isScoring:      true
  },
  {
    id:           'maxime.nempont@gmail.com',
    email:        'maxime.nempont@gmail.com',
    name:         'Maxime',
    avatar:       'http://agbonon.fr/img/Hugo_Agbonon.jpg',
    scoreFor:     2000,
    scoreAgainst: 3000,
    pokes:        ['maxime.nempont@gmail.com'],
    isScoring:    false
  }
];
*/
