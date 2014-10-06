'use strict';
NopeGame.AchievementsManager = Ember.Object.extend({
  achievements: {
    0: {
      title: 'Hundred nopes',
      description: 'Send a total of 100 nopes',
    },
    1: {
      title: 'Thousand nopes',
      description: 'Send a total of 1 000 nopes',
    },
    2: {
      title: 'Ten thousand nopes',
      description: 'Send a total of 10 000 nopes',
    },
    3: {
      title: 'A hundred thousand nopes',
      description: 'Send a total of 100 000 nopes',
    },
    4: {
      title: 'Million noper.',
      description: 'Send a total of 1 000 000 nopes',
    },
    5: {
      title: 'Skirmish of 100 nopes',
      description: 'Send 100 nopes to a single opponent',
    },
    6: {
      title: 'Clash of 1 000 nopes',
      description: 'Send 1 000 nopes to a single opponent',
    },
    7: {
      title: 'Duel of 10 000 nopes',
      description: 'Send 10 000 nopes to a single opponent',
    },
    8: {
     title: 'Battle of 100 000 nopes',
      description: 'Send 100 000 nopes to a single opponent',
    },
    9: {
     title: 'War of 1 000 000 nopes',
      description: 'Send 1 000 000 nopes to a single opponent',
    },
    10: {
      title: 'Pi noper.',
      description: 'Answer "nope" in 3.14 seconds',
    },
    11: {
      title: 'Pi noper 2',
      description: 'Answer "nope" in 3 minutes and 14 seconds',
    },
    12: {
      title: 'Pi noper 3',
      description: 'Answer "nope" in 3 hours and 14 minutes',
    },
    13: {
      title: 'The answer to life, the universe, and everything',
      description: 'Answer "nope" in 42 seconds',
    },
    14: {
      title: 'The answer to life, the universe, and everything 2',
      description: 'Answer "nope" in 42 minutes',
    },
    15: {
      title: 'The answer to life, the universe, and everything 3',
      description: 'Answer "nope" in 42 hours',
    },
    16: {
      title: 'Social noper',
      description: 'Have at least 5 friends',
    },
    17: {
      title: 'Party noper',
      description: 'Have at least 10 friends',
    },
    18: {
      title: 'Charisma noper',
      description: 'Have at least 15 friends',
    },

    // New, after first live version
    19: {
      title: 'First nope!',
      description: 'Send your first nope'
    },
    20: {
      title: 'This is Sparta!',
      description: 'Send 300 nopes to a single opponent',
    },
    21: {
      title: 'Vade retro, Satanas!',
      description: 'Send 666 nopes to a single opponent',
    },
    22: {
      title: 'Lucky bastard',
      description: 'Be lucky (1 chance out of 1 000 on every of your actions)',
    },
    23: {
      title: 'Devil\'s luck',
      description: 'Be lucky (1 chance out of 10 000 on every of your actions)',
    },
    24: {
      title: 'Lottery winner',
      description: 'Be lucky (1 chance out of 100 000 on every of your actions)',
    },
    25: {
      title: 'Graceful loser',
      description: 'Accept a defeat',
    },
    26: {
      title: 'Vengeance is a dish served cold',
      description: 'Lose 10 times',
    },
    27: {
      title: 'V.I.C.T.O.R.Y.',
      description: 'Earn your first victory',
    },
    28: {
      title: 'NOPE. ALL. MY. OPPONENTS.',
      description: 'Earn 10 victories',
    },
    29: {
      title: 'Peacekeeper',
      description: 'Be in a truce',
    },
    30: {
      title: 'Oathbreaker',
      description: 'Break a truce',
    },
    31: {
      title: '404 nope found',
      description: 'Answer "nope" in 404 seconds'
    },
    32: {
      title: '404 nope found 2',
      description: 'Answer "nope" in 404 minutes'
    },
    33: {
      title: 'Elite',
      description: 'Answer "nope" in 1337 seconds'
    },
    34: {
      title: 'h4x0r',
      description: 'Answer "nope" in 1337 minutes'
    }
  },

  // Kinda ugly but ooooooh well
  achievementsOrder: [
    19,0,1,2,3,4,5,20,21,6,7,8,9,
    10,11,12,13,14,15,31,32,33,34, // Time
    16,17,18, // Social
    25,26,27,28,29,30,
    22,23,24
  ],

  init: function() {
    var user = NopeGame.User.find(1);
    var userAchievements = user.get('achievements') || [];
    var newUserAchievements = [];
    for (var id in this.achievements) {
      if (!this.achievements.hasOwnProperty(id)) continue;
      if (userAchievements && userAchievements[id]) {
        newUserAchievements[id] = userAchievements[id];
        continue;
      }
      newUserAchievements[id] = {
        id: id,
        title: this.achievements[id].title,
        description: this.achievements[id].description,
        unlocked: false
      };
    }
    user.set('achievements', newUserAchievements);
    user.save();
  },

  unlock: function(achievementId) {
    var user = NopeGame.User.find(1);
    var achievements = user.get('achievements');
    var achievement = achievements[achievementId];
    if (achievements[achievementId].unlocked) return;
    var copiedAchievements = achievements.map(function(achievement) {
      return achievement;
    });
    copiedAchievements[achievementId].unlocked = true;
    user.set('achievements', achievements);
    user.save().then(function() {
      toastr.success(
        '<span style="font-weight:bold;">' + achievement.title + '</span>: '+
          achievement.description + '<br>' +
          '<a target="_blank" href="https://twitter.com/share?url=https%3A%2F%2Fwww.nope.wtf&text=' +
          encodeURIComponent('I just unlocked the "' + achievement.title + '" achievement in Nope!') +
          '"><i class="fa fa-twitter solo"></i> Tweet it!</a>',
        'Achievement unlocked!',
        { timeOut: 15000 }
      );
    });
  },

  /**
   * Update with data from the server
   * Note : this is not an unlock, we did not receive a notification to tell us
   * we just unlocked achievements, we are merely syncing (in case no data
   * about achievements was stored)
   * @param  {Object} dataAchievements / key : unlocked achievements as keys
   */
  update: function(dataAchievements) {
    var user = NopeGame.User.find(1);
    var achievements = user.get('achievements');
    var newAchievements = achievements.map(function(achievement, id) {
      return {
        id: id,
        title: achievement.title,
        description: achievement.description,
        unlocked: !! dataAchievements[id]
      };
    });
    user.set('achievements', newAchievements);
    user.save();
  }
});
