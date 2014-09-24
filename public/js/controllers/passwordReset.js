'use strict';
NopeGame.PasswordResetController = Ember.ObjectController.extend({
  actions: {
    sendNewPassword: function(data) {
      if (data.password1 !== data.password2 || !data.password2 || !data.password1) {
        return toastr.error('Passwords don\'t match!', 'Error');
      }
      $.ajax(
        {
          dataType: 'jsonp',
          data: {
            password: data.password1,
            token: data.resetToken
          },
          jsonp: CALLBACK_NAME,
          method: 'POST',
          url: PASSWORD_RESET_ROUTE
        }
      )
      .done(function() {
        toastr.success('You can now login with your e-mail and new password', 'Success', {timeOut: 10000});
        this.transitionTo('login');
      }.bind(this))
      .fail(function(xhr) {
        if (xhr.status === 403) {
          toastr.error('Invalid: You must request another password reset.', 'Error', {timeOut: 10000});
        } else if (xhr.status === 404) {
          toastr.error('Invalid: The account has been deleted', 'Error', {timeOut: 10000});
        }
        else { // FIXME detect not connected
          toastr.error('Please try again in a few minutes', 'Server error', {timeOut: 10000});
        }
      });
    }
  },
  content: {}
});
