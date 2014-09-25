'use strict';
NopeGame.ForgottenPasswordController = Ember.ObjectController.extend({
  actions: {
    sendPasswordResetRequest: function(data) {
      $.ajax(
        {
          dataType: 'jsonp',
          data: { email: data.email },
          jsonp: CALLBACK_NAME,
          method: 'POST',
          url: FORGOTTEN_PASSWORD_ROUTE
        }
      )
      .done(function() {
        toastr.info(
          'An e-mail has been sent to your address with instructions to reset your password',
          undefined,
          {timeOut: 10000}
        );
      })
      .fail(function(xhr) {
        if (xhr.status === 400) {
          toastr.error('Invalid e-mail.', 'Error', {timeOut: 10000});
        } else if (xhr.status === 403) {
          toastr.error('Invalid: Too many requests.', 'Error', {timeOut: 10000});
        } else if (xhr.status === 420) {
          toastr.error('You have already requested a password reset less than 5 minutes ago', 'Error', {timeOut: 10000});
        } else if (xhr.status === 404) {
          toastr.error('Invalid: No user with that email address.', 'Error', {timeOut: 10000});
        }
        else { // FIXME detect not connected
          toastr.error('Please try again in a few minutes', 'Server error', {timeOut: 10000});
        }
      });
    }
  },
  content: {}
});
