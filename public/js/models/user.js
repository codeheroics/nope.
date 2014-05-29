PokeGame.User = DS.Model.extend({
  name:           DS.attr('string'),
  email:          DS.attr('string'),
  avatar:         DS.attr('string'),
  totalScore:     DS.attr('number', { defaultValue: 0 }),
  totalPokes:     DS.attr('number', { defaultValue: 0 })
});

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
