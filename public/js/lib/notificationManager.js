'use strict';

// TODO : refactoring
// Eventually, this notification manager
// should handle all or most of the app's notifications
// (they should not be toastr.whatever everywhere)
NopeGame.NotificationManager = Ember.Object.extend({
  nopeNotifications: {},
  clearNopeNotifications: function(email) {
    if (!this.nopeNotifications[email]) {
      this.nopeNotifications[email] = [];
    }
    if (this.nopeNotifications[email].length < 2) return;
    toastr.clear(this.nopeNotifications[email].shift());

  },
  notifyNoped: function(nopeData) {
    this.clearNopeNotifications(nopeData.email);
    this.nopeNotifications[nopeData.email].push(
      toastr.warning(
        'received from <span style="font-weight:bold;">' + nopeData.opponentName + '</span>.',
        'Nope.'
      )
    );
    return Promise.resolve();
  },
  notifyNoping: function(nopeData) {
    this.clearNopeNotifications(nopeData.email);
    this.nopeNotifications[nopeData.email].push(
      toastr.success(
        'sent to <span style="font-weight:bold;">' + nopeData.opponentName + '</span>.',
        'Nope.'
      )
    );
    return Promise.resolve();
  },
});
