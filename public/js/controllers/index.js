PokeGame.IndexController = Ember.ArrayController.extend({
  opponentPokingMe: function() {
    var opponents = this.get('model');
    var opponentsPokingMe = opponents.filter(function(opponent) {
      return opponent._data.isScoring;
    });
    return opponentsPokingMe.length > 0 ? opponentsPokingMe[0] : false;
  }.property('opponentPokingMe')
});
