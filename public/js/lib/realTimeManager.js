'use strict';

PokeGame.RealTimeManager = Ember.Object.extend({
  pokeAt: function(data) {
    this.primus.write(data);
  },

  getPoked: function(data) {

  },

  init: function() {
    var self = this;
    this.primus = Primus.connect(PRIMUS_ROUTE);

    //
    // For convenience we use the private event `outgoing::url` to append the
    // authorization token in the query string of our connection URL.
    //
    this.primus.on('outgoing::url', function connectionURL(url) {
      console.log('ii');
      url.query = 'token=' + (localStorage.getItem('token') || '');
    });

    this.primus.on('data', this.getPoked);
  }
});
