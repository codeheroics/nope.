PokeGame.Opponent = DS.Model.extend({
  email:          DS.attr('string'),
  name:           DS.attr('string'),
  avatar:         DS.attr('string'),
  scoreFor:       DS.attr('number', { defaultValue: 0 }),
  scoreAgainst:   DS.attr('number', { defaultValue: 0 }),
  pokes:          DS.hasMany('poke', { async: true }),
  isScoring:      DS.attr('boolean')
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
