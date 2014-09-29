'use strict';

// TODO : refactoring
// Eventually, this notification manager
// should handle all or most of the app's notifications
// (they should not be toastr.whatever everywhere)
NopeGame.NotificationManager = Ember.Object.extend({
  nopeNotifications: {},
  truceNotifications: {},

  clearNopeNotifications: function(email) {
    if (!this.nopeNotifications[email]) {
      this.nopeNotifications[email] = [];
    }
    if (this.nopeNotifications[email].length < 2) return;
    this.nopeNotifications[email].shift().remove();
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

  clearTruceNotifications: function(email) {
    if (!this.truceNotifications[email]) {
      this.truceNotifications[email] = [];
    }
    if (this.truceNotifications[email].length < 1) return;
    this.truceNotifications[email].shift().remove();
  },

  notifyAcceptedTruce: function(opponent) {
    var email = opponent.get('email');
    this.clearTruceNotifications(email);
    this.truceNotifications[email].push(toastr.info(
      'You\'ll be able to send nopes again in an hour',
      'You are now in a truce with ' + opponent.get('name'),
      { timeOut: 10000 }
    ));
  },

  notifyReceivedTruceRequest: function(opponent) {
    var email = opponent.get('email');
    this.clearTruceNotifications(email);
    var truceToastr = toastr.info(
      '<button type="button" class="InputAddOn-item acceptTruce">Accept</button>' +
        '<button type="button" class="InputAddOn-item ignoreTruce">Ignore</button>',
      opponent.get('name') + ' proposes a truce',
      { timeOut: 60 * 60 * 1000 }
    );
    truceToastr.delegate('.acceptTruce', 'click', function () {
      NopeGame.serverManager.requestTruce(opponent);
      truceToastr.remove();
    }.bind(this));
    truceToastr.delegate('.ignoreTruce', 'click', function () {
      truceToastr.remove();
    }.bind(this));
    this.truceNotifications[email].push(truceToastr);
  },

  notifySentTruceRequest: function(opponent) {
    var email = opponent.get('email');
    this.clearTruceNotifications(email);
    this.truceNotifications[email].push(toastr.info(
      'You have sent a request for a truce to ' + opponent.get('name'),
      undefined,
      {timeOut: 10000}
    ));
  },

  notifyTruceBrokenByOpponent: function(opponent) {
    var email = opponent.get('email');
    this.clearTruceNotifications(email);
    this.truceNotifications[email].push(toastr.info(
      opponent.get('name') + ' has broken your truce!',
      undefined,
      {timeOut: 10000}
    ));
  },

  notifyTruceBrokenByMe: function(opponent) {
    var email = opponent.get('email');
    this.clearTruceNotifications(email);
    this.truceNotifications[email].push(toastr.info(
      'You have broken the truce you had with ' + opponent.get('name') + '!',
      undefined,
      {timeOut: 10000}
    ));
  }
});
