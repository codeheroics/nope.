'use strict';
NopeGame.Opponent = Ember.Model.extend({
  id:             Ember.attr(), // string
  email:          Ember.attr(), // string
  name:           Ember.attr(), // string
  nameLowerCase:  function() {
    return this.get('name').toLowerCase();
  }.property('name'),
  avatar:         Ember.attr(), // string
  timeFor:        Ember.attr(Number), // { defaultValue: 0 }),
  timeAgainst:    Ember.attr(Number), // { defaultValue: 0 }),
  computedTimeFor:function() {
    var unCommittedChanges = this.get('isScoring') ? this.get('timeDiffSinceLast') : 0;
    return this.get('timeFor') + unCommittedChanges;
  }.property('timeFor', 'isScoring', 'timeDiffSinceLast')
  .volatile(),

  computedTimeAgainst:function() {
    var unCommittedChanges = this.get('isScoring') ? 0 : this.get('timeDiffSinceLast');
    return this.get('timeAgainst') + unCommittedChanges;
  }.property('timeAgainst', 'isScoring', 'timeDiffSinceLast')
  .volatile(),

  // time diff since last nope
  timeDiffSinceLast:  function() {
    var truceBrokenTime = this.get('computedTruceBrokenTime') || 0;
    var isScoring = this.get('isScoring');
    var inTruceFrom = this.get('computedInTruceFrom') || 0;
    var inTruce = this.get('inTruce');
    var truceLength = 0;
    if (inTruce) {
      truceLength = Date.now() - inTruceFrom;
    }

    var lastNopeTime = this.get('computedLastNopeTime');
    var now = Date.now();
    if (!lastNopeTime) {
      // Prevent showing ludicrous durations without actually saving anything
      this.set('lastNopeTime', now);
      lastNopeTime = now;
    }

    return now - lastNopeTime - (inTruce ? truceLength : 0);

  }.property('computedLastNopeTime', 'computedTruceBrokenTime', 'isScoring', 'computedInTruceFrom', 'inTruce').volatile(),

  // total time diff against opponent
  timeDiff: function() {
    return Math.abs(
      this.get('computedTimeFor') - this.get('computedTimeAgainst')
    );
  }.property('computedTimeFor', 'computedTimeAgainst').volatile(),

  nopes:          Ember.hasMany('NopeGame.Nope', { key: 'nopesIds' }),
  nopesCpt:       Ember.attr(Number),
  isScoring:      Ember.attr(), // boolean
  status:         Ember.attr(), // string : "friend", "pending", "blocked"
  victories:      Ember.attr(Number),
  defeats:        Ember.attr(Number),
  inTruce:        function() { // if we're in truce (truce not ended or no nope since)
    return (this.get('computedTruceBrokenTime') || 0) < (this.get('computedInTruceUntil') || 0);
  }.property('computedInTruceUntil', 'computedTruceBrokenTime'),
  nopedSinceTruce:function () {
    return this.get('computedTruceBrokenTime') < this.get('computedLastNopeTime');
  }.property('computedTruceBrokenTime', 'computedLastNopeTime').volatile(),
  lastResetTime:  Ember.attr(Number), // This one is present as an indication, does not need to be computed

  // Those are all time which need to be adapted according to the current device time
  lastNopeTime:   Ember.attr(Number),
  inTruceFrom:    Ember.attr(), // In truce until *time*
  inTruceUntil:   Ember.attr(), // In truce until *time*
  truceBrokenTime:Ember.attr(),

  serverTimeDiff: function() {
    return parseInt(localStorage.getItem('serverTimeDiff') || 0, 10);
  }.property().volatile(),

  // All these computed times have the same objective : take in account the time diff with the server
  computedLastNopeTime: function() {
    return this.get('lastNopeTime')  + this.get('serverTimeDiff');
  }.property('lastNopeTime', 'serverTimeDiff'),
  computedInTruceFrom: function() {
    return this.get('inTruceFrom')  + this.get('serverTimeDiff');
  }.property('inTruceFrom', 'serverTimeDiff'),
  computedInTruceUntil: function() {
    return this.get('inTruceUntil')  + this.get('serverTimeDiff');
  }.property('inTruceUntil', 'serverTimeDiff'),
  computedTruceBrokenTime: function() {
    return this.get('truceBrokenTime')  + this.get('serverTimeDiff');
  }.property('truceBrokenTime', 'serverTimeDiff')
});

NopeGame.Opponent.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});
