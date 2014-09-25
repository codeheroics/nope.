'use strict';
var config = require('config');
var sendgrid  = require('sendgrid')(config.sendgridUser, config.sendgridKey);
var winston = require('winston');

if (process.env.NODE_ENV !== 'production') {
  sendgrid = {
    send: function(data, callback) {
      console.log(data);
      callback();
    }
  };
}

module.exports = {

  /**
   * [sendConfirmationMail description]
   * @param  {[type]}   user     [description]
   * @param  {[type]}   token    [description]
   * @param  {Function} callback err, json
   */
  sendConfirmationMail: function(user, token, callback) {
    if (!config.sendMails) return callback();
    winston.info('Sent a confirmation email to '+ user.email);
    var url = 'https://www.nope.wtf/confirm?token=' + token;
    sendgrid.send({
      to:       user.email,
      from:     'no-reply@nope.wtf',
      subject:  'Welcome to Nope, ' + user.name + '!',
      html:     '<h3>You have signed up for Nope, ' + user.name + '!</h3>' +
        '<p>Please click on the following URL to activate your account ' +
        '<a href="' + url + '">' + url + '</a>' +
        // ' or paste the following code in your application\'s confirmation box:</p>' +
        // '<p><b>' + token + '</b></p>' +
        '<p>I hope you\'ll have fun sending "nopes" at your friends</p>' +
        '<p>Sincerely,</p>' +
        '<p>The Chief Noper</p><p>&nbsp;</p>' +
        '<p>(If you did not expect this email, you can safely ignore it.)</p>',
      text: 'You have signed up for Nope.wtf, ' + user.name + '!\r\n\r\n' +
        'Please click on the following URL to activate your account ' +
        '<a href="' + url + '">' + url + '' +
        // ' or paste the following code in your application\'s confirmation box:' +
        // '' + token + '\r\n\r\n' +
        'I hope you\'ll have fun sending "nopes" at your friends\r\n\r\n' +
        'Sincerely,\r\n\r\n' +
        'The Chief Noper\r\n\r\n\r\n' +
        '(If you did not expect this email, you can safely ignore it.)'
    }, callback);
  },

  /**
   * [sendConfirmationMail description]
   * @param  {[type]}   user     [description]
   * @param  {[type]}   token    [description]
   * @param  {Function} callback err, json
   */
  // sendInvitationMail: function(email, referingUser, callback) {
  //   winston.info('Sent a invitation email to '+ email);
  //   var url = 'https://www.nope.wtf';
  //   sendgrid.send({
  //     to:       email,
  //     from:     'no-reply@nope.wtf',
  //     subject:  referingUser.name + ' invites you to join Nope!',
  //     html:     '<p>' + referingUser.name + '(' + referingUser.email + ') has invited you to join Nope.</p>' +
  //       '<p>Nope is a game where you send "nopes" to your opponent until one of you gives in.</p>' +
  //       '<p>to join, signup on https://www.nope.wtf !</p>' +
  //       '<p>Sincerely,</p><p>&nbsp;</p>' +
  //       '<p>The Chief Noper</p>',
  //     text: referingUser.name + '(' + referingUser.email + ') has invited you to join Nope.' +
  //       'Nope is a game where you send "nopes" to your opponent until one of you gives in.\r\n' +
  //       'to join, signup on https://www.nope.wtf !\r\n' +
  //       'Sincerely,\r\n\r\n' +
  //       'The Chief Noper'
  //   }, callback);
  // },

  sendForgottenPasswordEmail: function(email, token, callback) {
    winston.info('Sent forgotten password email to '+ email);

    var url = 'https://www.nope.wtf/password-reset?token=' + token;
    sendgrid.send({
      to:       email,
      from:     'no-reply@nope.wtf',
      subject:  'Nope.wtf - Lost password',
      html:     '<p>You have requested a reset for your forgotten password at Nope.wtf.</p>' +
        '<p>Click the following link to reset your password: <a href="' + url + '">' + url + '</a>"' +
        '<p>(If you did not expect this email, you can safely ignore it.)</p>',
      text: 'You have requested a reset for your forgotten password at Nope.wtf.\r\n\r\n' +
        'Click the following link to reset your password: ' + url + '\r\n\r\n' +
        '(If you did not expect this email, you can safely ignore it.)',
    }, callback);

  }
};
