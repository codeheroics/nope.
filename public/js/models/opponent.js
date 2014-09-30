'use strict';
NopeGame.Opponent = Ember.Model.extend({
  id:             Ember.attr(), // string
  email:          Ember.attr(), // string
  name:           Ember.attr(), // string
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
    var truceBrokenTime = this.get('truceBrokenTime') || 0;
    var isScoring = this.get('isScoring');
    var inTruceFrom = this.get('inTruceFrom') || 0;
    var inTruce = this.get('inTruce');
    var truceLength = (inTruce ? Date.now() : truceBrokenTime) - inTruceFrom;

    var lastNopeTime = this.get('lastNopeTime');
    var now = Date.now();
    if (!lastNopeTime) {
      // Prevent showing ludicrous durations without actually saving anything
      this.set('lastNopeTime', now);
      lastNopeTime = now;
    }

    var trucelengthNeedsRemoval = inTruce || (truceBrokenTime && truceBrokenTime > lastNopeTime);

    return now - lastNopeTime - (
      parseInt(window.localStorage.getItem('serverTimeDiff') || 0, 10)
    ) - (trucelengthNeedsRemoval ? truceLength : 0);

  }.property('lastNopeTime', 'truceBrokenTime', 'isScoring', 'inTruceFrom', 'inTruce').volatile(),

  // total time diff against opponent
  timeDiff: function() {
    var timeFor = this.get('model.timeFor');
    var timeAgainst = this.get('model.timeAgainst');
    return Math.abs(
      this.get('computedTimeFor') - this.get('computedTimeAgainst')
    );
  }.property('computedTimeFor', 'computedTimeAgainst').volatile(),

  nopes:          Ember.hasMany('NopeGame.Nope', { key: 'nopesIds' }),
  nopesCpt:       Ember.attr(Number),
  lastNopeTime:   Ember.attr(Number),
  isScoring:      Ember.attr(), // boolean
  status:         Ember.attr(), // string : "friend", "pending", "blocked"
  victories:      Ember.attr(Number),
  defeats:        Ember.attr(Number),
  lastResetTime:  Ember.attr(Number),
  inTruceFrom:    Ember.attr(), // In truce until *time*
  inTruceUntil:   Ember.attr(), // In truce until *time*
  truceBrokenTime:Ember.attr(),
  inTruce:        function() { // if we're in truce (truce not ended or no nope since)
    return (this.get('truceBrokenTime') || 0) < (this.get('inTruceUntil') || 0);
  }.property('inTruceUntil', 'truceBrokenTime'),
  nopedSinceTruce:function () {
    return this.get('truceBrokenTime') < this.get('lastNopeTime');
  }.property('truceBrokenTime', 'lastNopeTime')
});

NopeGame.Opponent.reopenClass({
  adapter: Ember.LocalStorageAdapter.create()
});
