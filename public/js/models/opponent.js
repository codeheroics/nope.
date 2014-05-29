PokeGame.Opponent = DS.Model.extend({
  email:          DS.attr('string'),
  name:           DS.attr('string'),
  avatar:         DS.attr('string'),
  scoreFor:       DS.attr('number', { defaultValue: 0 }),
  scoreAgainst:   DS.attr('number', { defaultValue: 0 }),
  pokes:          DS.hasMany('poke', { async: true }),
  isScoring:      DS.attr('boolean')
});

PokeGame.Opponent.FIXTURES = [
  {
    id:             1,
    email:          'eclaerhout@gmail.com',
    name:           'Emilie',
    avatar:         'http://agbonon.fr/img/Hugo_Agbonon.jpg',
    scoreFor:       4242,
    scoreAgainst:   1242,
    pokes:          [1, 3, 4],
    isScoring:      true
  },
  {
    id:           2,
    email:        'maxime.nempont@gmail.com',
    name:         'Maxime',
    avatar:       'http://agbonon.fr/img/Hugo_Agbonon.jpg',
    scoreFor:     2000,
    scoreAgainst: 3000,
    pokes:        [2],
    isScoring:    false
  }
];