'use strict';
var PI_SECONDS_LOW          = 3140;
var PI_SECONDS_HIGH         = 3150;
var PI_MINUTES_LOW          = 194000;
var PI_MINUTES_HIGH         = 195000;
var PI_HOURS_LOW            = 11640000;
var PI_HOURS_HIGH           = 11700000;
var FOURTY_TWO_SECONDS_LOW  = 42000;
var FOURTY_TWO_SECONDS_HIGH = 43000;
var FOURTY_TWO_MINUTES_LOW  = 2520000;
var FOURTY_TWO_MINUTES_HIGH = 2580000;
var FOURTY_TWO_HOURS_LOW    = 151200000;
var FOURTY_TWO_HOURS_HIGH   = 154800000;


var achievements = {
  0: {
    title: 'Hundred nopes.',
    description: 'Send a total of 100 nopes.',
    hasEarned: hasEarnedTotalNopes.bind(null, 100)
  },
  1: {
    title: 'Thousand nopes.',
    description: 'Send a total of 1 000 nopes.',
    hasEarned: hasEarnedTotalNopes.bind(null, 1000)
  },
  2: {
    title: 'Ten thousand nopes.',
    description: 'Send a total of 10 000 nopes.',
    hasEarned: hasEarnedTotalNopes.bind(null, 10000)
  },
  3: {
    title: 'A hundred thousand nopes.',
    description: 'Send a total of 100 000 nopes.',
    hasEarned: hasEarnedTotalNopes.bind(null, 100000)
  },
  4: {
    title: 'Million noper.',
    description: 'Send a total of 1 000 000 nopes.',
    hasEarned: hasEarnedTotalNopes.bind(null, 1000000)
  },
  5: {
    title: 'Duel of 100 nopes.',
    description: 'Send 100 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 100)
  },
  6: {
    title: 'Duel of 1 000 nopes.',
    description: 'Send 1 000 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 1000)
  },
  7: {
    title: 'Duel of 10 000 nopes.',
    description: 'Send 10 000 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 10000)
  },
  8: {
    title: 'Duel of 100 000 nopes.',
    description: 'Send 100 000 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 100000)
  },
  9: {
    title: 'Duel of 1 000 000 nopes.',
    description: 'Send 1 000 000 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 1000000)
  },
  10: {
    title: 'Pi noper.',
    description: 'Answer nope. in 3.14 seconds',
    hasEarned: function(user, pokeData) {
      return pokeData.timeDiff >= PI_SECONDS_LOW && pokeData.timeDiff < PI_SECONDS_HIGH;
    }
  },
  11: {
    title: 'Pi noper 2',
    description: 'Answer nope. in 3 minutes and 14 seconds',
    hasEarned: function(user, pokeData) {
      return pokeData.timeDiff >= PI_MINUTES_LOW && pokeData.timeDiff < PI_MINUTES_HIGH;
    }
  },
  12: {
    title: 'Pi noper 3',
    description: 'Answer nope. in 3 hours and 14 minutes',
    hasEarned: function(user, pokeData) {
      return pokeData.timeDiff >= PI_HOURS_LOW && pokeData.timeDiff < PI_HOURS_HIGH;
    }
  },
  13: {
    title: 'The answer to life, the universe, and everything',
    description: 'Answer nope. in 42 seconds',
    hasEarned: function(user, pokeData) {
      return pokeData.timeDiff >= FOURTY_TWO_SECONDS_LOW
        && pokeData.timeDiff < FOURTY_TWO_SECONDS_HIGH;
    }
  },
  14: {
    title: 'The answer to life, the universe, and everything 2',
    description: 'Answer nope. in 42 minutes',
    hasEarned: function(user, pokeData) {
      return pokeData.timeDiff >= FOURTY_TWO_MINUTES_LOW
        && pokeData.timeDiff < FOURTY_TWO_MINUTES_HIGH;
    }
  },
  15: {
    title: 'The answer to life, the universe, and everything 3',
    description: 'Answer nope. in 42 hours',
    hasEarned: function(user, pokeData) {
      return pokeData.timeDiff >= FOURTY_TWO_HOURS_LOW
        && pokeData.timeDiff < FOURTY_TWO_HOURS_HIGH;
    }
  },
  16: {
    title: 'Social noper',
    description: 'Have at least 5 friends',
    hasEarned: function(user, pokeData) {
      return Object.keys(user.friendsPokes).length > 5;
    }
  },
  17: {
    title: 'Party noper',
    description: 'Invite at least 5 friends',
    hasEarned: function() {}
  }
};

var achievableByPokingIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
var achievableByNewFriendsIds = [16];
var achievableByInviteIds = [17];

function hasEarnedTotalNopes(nopesToObtain, user) {
  return user.totalPokes >= nopesToObtain;
}

function hasEarnedOpponentNopes(nopesToObtain, user, pokeData) {
  return pokeData.pokesCpt >= nopesToObtain;
}

module.exports = {
  earnedAfterPoking: function(user, pokeData) {
    return achievableByPokingIds.filter(function(achievementId) {
      if (user.achievements[achievementId]) return false; // Already earned
      return achievements[achievementId].hasEarned(user, pokeData);
    });
  },

  earnedAfterNewFriends: function(user) {
    return achievableByNewFriendsIds.filter(function(achievementId) {
      if (user.achievements[achievementId]) return false; // Already earned
      return achievements[achievementId].hasEarned(user);
    });
  }
};
