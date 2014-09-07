'use strict';
NopeGame.User = Ember.Model.extend({
  id:             Ember.attr(), // string
  name:           Ember.attr(), // string
  email:          Ember.attr(), // string
  avatar:         Ember.attr(), // string
  timeNoping:     Ember.attr(Number), // { defaultValue: 0 }
  totalNopes:     Ember.attr(Number), // { defaultValue: 0 }
  achievements:   Ember.attr(Array, { defaultValue: [] })
});

NopeGame.User.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});
