'use strict';
PokeGame.AchievementsManager = Ember.Object.extend({
  achievements: {
    0: {
      title: 'Hundred nopes.',
      description: 'Send a total of 100 nopes.',
    },
    1: {
      title: 'Thousand nopes.',
      description: 'Send a total of 1 000 nopes.',
    },
    2: {
      title: 'Ten thousand nopes.',
      description: 'Send a total of 10 000 nopes.',
    },
    3: {
      title: 'A hundred thousand nopes.',
      description: 'Send a total of 100 000 nopes.',
    },
    4: {
      title: 'Million noper.',
      description: 'Send a total of 1 000 000 nopes.',
    },
    5: {
      title: 'Duel of 100 nopes.',
      description: 'Send 100 nopes to a single opponent',
    },
    6: {
      title: 'Duel of 1 000 nopes.',
      description: 'Send 1 000 nopes to a single opponent',
    },
    7: {
      title: 'Duel of 10 000 nopes.',
      description: 'Send 10 000 nopes to a single opponent',
    },
    8: {
      title: 'Duel of 100 000 nopes.',
      description: 'Send 100 000 nopes to a single opponent',
    },
    9: {
      title: 'Duel of 1 000 000 nopes.',
      description: 'Send 1 000 000 nopes to a single opponent',
    },
    10: {
      title: 'Pi noper.',
      description: 'Answer nope. in 3.14 seconds',
    },
    11: {
      title: 'Pi noper 2',
      description: 'Answer nope. in 3 minutes and 14 seconds',
    },
    12: {
      title: 'Pi noper 3',
      description: 'Answer nope. in 3 hours and 14 minutes',
    },
    13: {
      title: 'The answer to life, the universe, and everything',
      description: 'Answer nope. in 42 seconds',
    },
    14: {
      title: 'The answer to life, the universe, and everything 2',
      description: 'Answer nope. in 42 minutes',
    },
    15: {
      title: 'The answer to life, the universe, and everything 3',
      description: 'Answer nope. in 42 hours',
    },
    16: {
      title: 'Social noper',
      description: 'Have at least 5 friends',
    },
    17: {
      title: 'Party noper',
      description: 'Invite at least 5 friends',
    }
  },
  init: function() {
    for (var id in this.achievements) {
      if (!this.achievements.hasOwnProperty(id)) continue;
      if (PokeGame.Achievement.find(id).isLoaded) continue;
      PokeGame.Achievement.create({
        id: id,
        title: this.achievements[id].title,
        description: this.achievements[id].description,
        unlocked: false
      }).save();
    }
    return this;
  },

  unlock: function(achievementId) {
    var achievement = PokeGame.Achievement.find(achievementId);
    if (!achievement.isLoaded) return;
    if (achievement.get('unlocked')) return;
    achievement.set('unlocked', true);
    achievement.save().then(function() {
      toastr.success(
        '<span style="font-weight:bold;">' + achievement.get('title') + '</span>: '+
          achievement.get('description'),
        'Achievement unlocked!',
        { timeOut: 10000 }
      );
    });
  }
});
