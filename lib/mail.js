'use strict';
var config = require('config');
var sendgrid  = require('sendgrid')(config.sendgridUser, config.sendgridKey);

module.exports = {
  sendConfirmationMail: function(user, token, callback) {
    var url = 'https://www.nope.wtf/confirm?token=' + token;
    sendgrid.send({
      to:       user.email,
      from:     'no-reply@nope.wtf',
      subject:  'Welcome to Nope, ' + user.name + '!',
      html:     '<h3>You have signed up for Nope, ' + user.name + '!</h3>' +
        '<p>Please click on the following URL to activate your account ' +
        '<a href="' + url + '">' + url + '</a>' +
        ' or paste the following code in your application\'s confirmation box:</p>' +
        '<p><b>' + token + '</b></p>' +
        '<p>I hope you\'ll have fun sending "nopes" at your friends</p>' +
        '<p>Sincerely,</p>' +
        '<p>The Chief Noper</p><p>&nbsp;</p>' +
        '<p>(If you did not expect this email, you can safely ignore it.)</p>',
      text: 'You have signed up for Nope, ' + user.name + '!' +
        'Please click on the following URL to activate your account ' +
        '<a href="' + url + '">' + url + '' +
        ' or paste the following code in your application\'s confirmation box:' +
        '' + token + '\r\n\r\n' +
        'I hope you\'ll have fun sending "nopes" at your friends\r\n\r\n' +
        'Sincerely,\r\n\r\n' +
        'The Chief Noper\r\n\r\n\r\n\r\n' +
        '(If you did not expect this email, you can safely ignore it.)'
    }, function(err, json) {
      if (err) { return console.error(err); }
      console.log(json);
      callback(err, json);
    });
  },

  sendInvitationMail: function(email, referingUser, token, callback) {
    var url = 'https://www.nope.wtf/?token=' + token + '#/signup';
    sendgrid.send({
      to:       email,
      from:     'no-reply@nope.wtf',
      subject:  referingUser.name + ' invites you to join Nope!',
      html:     '<p>' + referingUser.name + '(' + referingUser.email + ') has invited you to join Nope.</p>' +
        '<p>Nope is a game where you send "nopes" to your opponent until one of you gives in.</p>' +
        '<p>to join, signup on http://www.nope.wtf !</p>' +
        '<p>Sincerely,</p><p>&nbsp;</p>' +
        '<p>The Chief Noper</p>',
      text: referingUser.name + '(' + referingUser.email + ') has invited you to join Nope.' +
        'Nope is a game where you send "nopes" to your opponent until one of you gives in.\r\n' +
        'to join, signup on http://www.nope.wtf !\r\n' +
        'Sincerely,\r\n\r\n' +
        'The Chief Noper'
    }, function(err, json) {
      if (err) { return console.error(err); }
      console.log(json);
      callback(err, json);
    });
  }
};
