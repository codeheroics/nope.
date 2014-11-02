'use strict';
NopeGame.SignupController = Ember.ObjectController.extend({
  content: {},
  actions: {
    signup: function(formData) {
      if (!validator.isEmail(formData.email)) return toastr.error('Invalid email', undefined, { timeOut: 5000 });

      $.ajax(
        {
          data: {
            email: formData.email,
            name: formData.name,
            password: formData.password
          },
          jsonp: CALLBACK_NAME,
          method: 'POST',
          url: SIGNUP_ROUTE
        }
      )
      .done(function() {
        toastr.info(
          'Check your emails for confirmation link',
          'Successfully signed up!',
          { timeOut: 30000 }
        );
        this.transitionToRoute('/login');
      }.bind(this))
      .fail(function(jqXHR) {
        toastr.error(
          jqXHR.status === 403 ? 'E-mail already used' : jqXHR.status === 0 ? 'Internet connection error' : 'Server error',
          'Error during signup'
        );
        // Error with signup : either email already taken, or server error
      });
    }
  }
});
