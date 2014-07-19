'use strict';

PokeGame.RealTimeManager = Ember.Object.extend({
  pokeAt: function(data) {
    this.primus.write(data);
  },

  getPoked: function(data) {

  },

  init: function() {
    var self = this;
    this.primus = Primus.connect(
      PRIMUS_ROUTE, { strategy : ['online', 'disconnect'] }
    );

    //
    // For convenience we use the private event `outgoing::url` to append the
    // authorization token in the query string of our connection URL.
    //
    this.primus.on('outgoing::url', function connectionURL(url) {
      url.query = 'access_token=' + (localStorage.getItem('token') || '');
    });

    this.primus.on('data', this.getPoked);

    this.primus.on('error', function error(err) {
      console.error('Something horrible has happened', err);
    });
  }
});
