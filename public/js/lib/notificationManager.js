'use strict';

// TODO : refactoring
// Eventually, this notification manager
// should handle all or most of the app's notifications
// (they should not be toastr.whatever everywhere)
NopeGame.NotificationManager = Ember.Object.extend({
  loadingNotification: null,

  nopeNotifications: {},
  truceNotifications: {},
  victoryNotifications: {},

  showInitialLoading: function() {
    if (this.loadingNotification) return;
    this.loadingNotification = toastr.info(
      'Connecting to Nope... <i class="fa fa-spin fa-spinner"></i>',
      null,
      {
        timeOut: 0,
        extendedTimeOut: 0,
        tapToDismiss: false
      }
    );
  },

  showLoading: function() {
    if (this.loadingNotification) return;
    this.loadingNotification = toastr.info(
      'You are being reconnected <i class="fa fa-spin fa-spinner"></i>',
      null,
      {
        timeOut: 0,
        extendedTimeOut: 0,
        tapToDismiss: false
      }
    );
  },

  clearLoading: function() {
    if (!this.loadingNotification) return;

    toastr.clear(this.loadingNotification);
    delete this.loadingNotification;
  },

  clearNopeNotifications: function(email) {
    if (!this.nopeNotifications[email]) {
      this.nopeNotifications[email] = [];
    }
    if (this.nopeNotifications[email].length < 2) return;
    this.nopeNotifications[email].shift().remove();
  },

  clearTruceNotifications: function(email) {
    if (!this.truceNotifications[email]) {
      this.truceNotifications[email] = [];
    }
    if (this.truceNotifications[email].length < 1) return;
    this.truceNotifications[email].shift().remove();
  },

  clearVictoryNotifications: function(email) {
    if (!this.victoryNotifications[email]) {
      this.victoryNotifications[email] = [];
    }
    if (this.victoryNotifications[email].length < 1) return;
    this.victoryNotifications[email].shift().remove();
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

  notifyAcceptedTruce: function(opponent) {
    var email = opponent.get('email');
    this.clearTruceNotifications(email);
    this.truceNotifications[email].push(toastr.info(
      'You\'ll be able to send nopes again in an hour',
      'You are now in a truce with <span style="font-weight:bold;">' +
        opponent.get('name') + '</span>',
      { timeOut: 15000 }
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
      'You have sent a truce proposal to <span style="font-weight:bold;">' +
        opponent.get('name') + '</span>. It can be accepted within 5 minutes.',
      undefined,
      {timeOut: 10000}
    ));
  },

  notifyTruceBrokenByOpponent: function(opponent) {
    var email = opponent.get('email');
    this.clearTruceNotifications(email);
    this.truceNotifications[email].push(toastr.info(
      '<span style="font-weight:bold;">' + opponent.get('name') + '</span> ' +
        'has broken your truce!',
      undefined,
      {timeOut: 15000}
    ));
  },

  notifyTruceBrokenByMe: function(opponent) {
    var email = opponent.get('email');
    this.clearTruceNotifications(email);
    this.truceNotifications[email].push(toastr.info(
      'You have broken the truce you had with <span style="font-weight:bold;">' +
      opponent.get('name') + '</span>!',
      undefined,
      {timeOut: 10000}
    ));
  },

  notifyOpponentAdmittedDefeat: function(opponent) {
    var email = opponent.get('email');
    var name = opponent.get('name');
    var lastResetTime = opponent.get('lastResetTime');
    this.clearVictoryNotifications(email);
    var messageIfNow = '<span style="font-weight:bold;">' + name +
      '</span> has admitted defeat! The counters are now reset, continue like this!';
    var messageIfOld = '<span style="font-weight:bold;">' + name +
      '</span> admitted defeat ' + moment(lastResetTime).fromNow() + '! The counters were reset, keep going!';
    this.victoryNotifications[email].push(toastr.success(
      Date.now() - lastResetTime < 120000 ? messageIfNow : messageIfOld,
      'Victory!',
      {timeOut: 15000}
    ));
  },

  notifyMyAdmittedDefeat: function(opponent) {
    var email = opponent.get('email');
    var name = opponent.get('name');
    var lastResetTime = opponent.get('lastResetTime');
    this.clearVictoryNotifications(email);
    this.victoryNotifications[email].push(toastr.info(
      'The counters are now reset, get back at <span style="font-weight:bold;">' +
        opponent.get('name') + '</span> during the next one!',
      'You conceded your loss for this round',
      {timeOut: 15000}
    ));
  },

  notifyOpponentDeclaredVictory: function(opponent) {
    var email = opponent.get('email');
    var name = opponent.get('name');
    var lastResetTime = opponent.get('lastResetTime');
    this.clearVictoryNotifications(email);
    var messageIfNow = '<span style="font-weight:bold;">' + name +
      '</span> won the last round! The counters are now reset, it\'s time for a counterattack!';
    var messageIfOld = '<span style="font-weight:bold;">' + name +
      '</span> won the last round ' + moment(lastResetTime).fromNow() + '! The counters were reset, it\'s time for a counterattack!';
    this.victoryNotifications[email].push(toastr.info(
      Date.now() - lastResetTime < 120000 ? messageIfNow : messageIfOld,
      'You have lost a round',
      {timeOut: 15000}
    ));
  },

  notifyMyDeclaredVictory: function(opponent) {
    var email = opponent.get('email');
    var name = opponent.get('name');
    var lastResetTime = opponent.get('lastResetTime');
    this.clearVictoryNotifications(email);
    this.victoryNotifications[email].push(toastr.info(
      'You\'ve won this round against <span style="font-weight:bold;">' +
        opponent.get('name') + '</span>! Continue like this!',
      'Victory!',
      {timeOut: 15000}
    ));
  }


});
