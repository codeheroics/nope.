'use strict';
NopeGame.SignupController = Ember.ObjectController.extend({
  message: function() {
    return 'bouh';
  }.property('message'),

  csrf: function() {
    return 'bouh';
  }.property('csrf'),

  content: {},

  actions: {
    signup: function(formData) {
      var isEmail = function(email) { // FIXME use a better email verification
        var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return regex.test(email);
      };
      if (!isEmail(formData.email)) return toastr.error('Invalid email', undefined, { timeOut: 5000 });

      $.ajax(
        {
          dataType: 'jsonp',
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
      .fail(function(jqXHR) {console.log(jqXHR);
        toastr.error(
          jqXHR.status === 403 ? 'E-mail already used' : jqXHR.status === 0 ? 'Internet connection error' : 'Server error',
          'Error during signup',
          { timeOut: 5000 }
        );
        // Error with signup : either email already taken, or server error
      });
    }
  }
});
