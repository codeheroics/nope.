PokeGame.Poke = DS.Model.extend({
  opponent:         DS.belongsTo('opponent', { async: false }),
  isReceived:       DS.attr('boolean'),
  time:             DS.attr('number'),
  date:             function() {return new Date(this.get('time')); }.property('date'),
  points:           DS.attr('number')
});
/*
PokeGame.Poke.FIXTURES = [
  {
    id:               '1402529967087eclaerhout@gmail.com',
    opponent:         'eclaerhout@gmail.com',
    isReceived:       true,
    date:             new Date(1402529967087),
    points:           19
  },{
    id:               '1402530035256maxime.nempont@gmail.com',
    opponent:         'maxime.nempont@gmail.com',
    isReceived:       false,
    date:             new Date(1402530035256),
    points:           23
  },{
    id:               '1402530067256eclaerhout@gmail.com',
    opponent:         'eclaerhout@gmail.com',
    isReceived:       false,
    date:             new Date(1402530067256),
    points:           42
  },{
    id:               '1402530099444eclaerhout@gmail.com',
    opponent:         'eclaerhout@gmail.com',
    isReceived:       true,
    date:             new Date(1402530099444),
    points:           42
  }
];
*/
