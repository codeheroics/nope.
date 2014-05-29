PokeGame.Poke = DS.Model.extend({
  opponent:         DS.belongsTo('opponent', {async: true}),
  isReceived:       DS.attr('boolean'),
  date:             DS.attr('date', { defaultValue: Date.now }),
  points:           DS.attr('number')
});

PokeGame.Poke.FIXTURES = [
  {
    id:               1,
    opponent:         1,
    isReceived:       true,
    date:             new Date(Date.now() - 2 * 60 * 1000),
    points:           19
  },{
    id:               2,
    opponent:         2,
    isReceived:       false,
    date:             new Date(Date.now() - 60 * 1000),
    points:           23
  },{
    id:               3,
    opponent:         1,
    isReceived:       false,
    date:             new Date(Date.now() - 30 * 1000),
    points:           42
  },{
    id:               4,
    opponent:         1,
    isReceived:       true,
    date:             new Date(),
    points:           42
  }
];
