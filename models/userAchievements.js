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

var FOUR_HUNDRED_AND_FOUR_SECONDS = 404000;
var FOUR_HUNDRED_AND_FIVE_SECONDS = 405000;
var FOUR_HUNDRED_AND_FOUR_MINUTES = 24240000;
var FOUR_HUNDRED_AND_FIVE_MINUTES = 24300000;
var LEET_SECONDS = 1337000;
var LEET_PLUS_ONE_SECONDS = 1338000;
var LEET_MINUTES = 80220000;
var LEET_PLUS_ONE_MINUTES = 80220000;


var achievements = {
  // Original achievements : 0 to 18
  0: {
    title: 'Hundred nopes',
    description: 'Send a total of 100 nopes',
    hasEarned: hasEarnedTotalNopes.bind(null, 100)
  },
  1: {
    title: 'Thousand nopes',
    description: 'Send a total of 1 000 nopes',
    hasEarned: hasEarnedTotalNopes.bind(null, 1000)
  },
  2: {
    title: 'Ten thousand nopes',
    description: 'Send a total of 10 000 nopes',
    hasEarned: hasEarnedTotalNopes.bind(null, 10000)
  },
  3: {
    title: 'A hundred thousand nopes',
    description: 'Send a total of 100 000 nopes',
    hasEarned: hasEarnedTotalNopes.bind(null, 100000)
  },
  4: {
    title: 'Million noper.',
    description: 'Send a total of 1 000 000 nopes',
    hasEarned: hasEarnedTotalNopes.bind(null, 1000000)
  },
  5: {
    title: 'Skirmish of 100 nopes',
    description: 'Send 100 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 100)
  },
  6: {
    title: 'Clash of 1 000 nopes',
    description: 'Send 1 000 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 1000)
  },
  7: {
    title: 'Duel of 10 000 nopes',
    description: 'Send 10 000 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 10000)
  },
  8: {
    title: 'Battle of 100 000 nopes',
    description: 'Send 100 000 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 100000)
  },
  9: {
    title: 'War of 1 000 000 nopes',
    description: 'Send 1 000 000 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 1000000)
  },
  10: {
    title: 'Pi noper.',
    description: 'Answer "nope" in 3.14 seconds',
    hasEarned: function(user, nopeData) {
      return nopeData.timeDiff >= PI_SECONDS_LOW && nopeData.timeDiff < PI_SECONDS_HIGH;
    }
  },
  11: {
    title: 'Pi noper 2',
    description: 'Answer "nope" in 3 minutes and 14 seconds',
    hasEarned: function(user, nopeData) {
      return nopeData.timeDiff >= PI_MINUTES_LOW && nopeData.timeDiff < PI_MINUTES_HIGH;
    }
  },
  12: {
    title: 'Pi noper 3',
    description: 'Answer "nope" in 3 hours and 14 minutes',
    hasEarned: function(user, nopeData) {
      return nopeData.timeDiff >= PI_HOURS_LOW && nopeData.timeDiff < PI_HOURS_HIGH;
    }
  },
  13: {
    title: 'The answer to life, the universe, and everything',
    description: 'Answer "nope" in 42 seconds',
    hasEarned: function(user, nopeData) {
      return nopeData.timeDiff >= FOURTY_TWO_SECONDS_LOW &&
        nopeData.timeDiff < FOURTY_TWO_SECONDS_HIGH;
    }
  },
  14: {
    title: 'The answer to life, the universe, and everything 2',
    description: 'Answer "nope" in 42 minutes',
    hasEarned: function(user, nopeData) {
      return nopeData.timeDiff >= FOURTY_TWO_MINUTES_LOW &&
        nopeData.timeDiff < FOURTY_TWO_MINUTES_HIGH;
    }
  },
  15: {
    title: 'The answer to life, the universe, and everything 3',
    description: 'Answer "nope" in 42 hours',
    hasEarned: function(user, nopeData) {
      return nopeData.timeDiff >= FOURTY_TWO_HOURS_LOW &&
        nopeData.timeDiff < FOURTY_TWO_HOURS_HIGH;
    }
  },
  16: {
    title: 'Social noper',
    description: 'Have at least 5 friends',
    hasEarned: function(user, nopeData) {
      return Object.keys(user.friendsNopes).length >= 5;
    }
  },
  17: {
    title: 'Party noper',
    description: 'Have at least 10 friends',
    hasEarned: function(user, nopeData) {
      return Object.keys(user.friendsNopes).length >= 10;
    }
  },
  18: {
    title: 'Charisma noper',
    description: 'Have at least 15 friends',
    hasEarned: function(user, nopeData) {
      return Object.keys(user.friendsNopes).length >= 15;
    }
  },

  // Added after going live
  19: {
    title: 'First nope',
    description: 'Send your first nope',
    hasEarned: hasEarnedTotalNopes.bind(null, 1)
  },
  20: {
    title: 'This is Sparta!',
    description: 'Send 300 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 300)
  },
  21: {
    title: 'Vade retro, Satanas!',
    description: 'Send 666 nopes to a single opponent',
    hasEarned: hasEarnedOpponentNopes.bind(null, 666)
  },
  22: {
    title: 'Lucky bastard',
    description: 'Be lucky (1 chance out of 1 000 on every of your actions)',
    hasEarned: function() {
      return Math.floor(Math.random() * 1000) === 0;
    }
  },
  23: {
    title: 'Devil\'s luck',
    description: 'Be lucky (1 chance out of 10 000 on every of your actions)',
    hasEarned: function() {
      return Math.floor(Math.random() * 10000) === 0;
    }
  },
  24: {
    title: 'Lottery winner',
    description: 'Be lucky (1 chance out of 100 000 on every of your actions)',
    hasEarned: function() {
      return Math.floor(Math.random() * 100000) === 0;
    }
  },
  25: {
    title: 'I was just getting warmed up',
    description: 'Accept your defeat for the first time',
    hasEarned: function(user) {
      return user.defeats > 0;
    }
  },
  26: {
    title: 'Graceful loser',
    description: 'Accept your defeat for the tenth time',
    hasEarned: function(user) {
      return user.defeats >= 10;
    }
  },
  27: {
    title: 'V.I.C.T.O.R.Y.',
    description: 'Earn your first victory',
    hasEarned: function(user) {
      return user.victories > 0;
    }
  },
  28: {
    title: 'NOPE. ALL. MY. OPPONENTS.',
    description: 'Earn 10 victories',
    hasEarned: function(user) {
      return user.victories >= 10;
    }
  },
  29: {
    title: 'Peacekeeper',
    description: 'Be in a truce',
    hasEarned: function(user, nopeData) {
      return !! nopeData.inTruce.startTime;
    }
  },
  30: {
    title: 'Oathbreaker.',
    description: 'Break a truce',
    hasEarned: function(user, nopeData) {
      return nopeData.inTruce.brokenByMe;
    }
  },
  31: {
      title: '404 nope found',
    description: 'Answer "nope" in 4 minutes and 4 seconds',
    hasEarned: function(user, nopeData) {
      return nopeData.timeDiff >= FOUR_HUNDRED_AND_FOUR_SECONDS &&
        nopeData.timeDiff < FOUR_HUNDRED_AND_FIVE_SECONDS;
    }
  },
  32: {
      title: '404 nope found 2',
    description: 'Answer "nope" in 4 hours and 4 minutes',
    hasEarned: function(user, nopeData) {
      return nopeData.timeDiff >= FOUR_HUNDRED_AND_FOUR_MINUTES &&
        nopeData.timeDiff < FOUR_HUNDRED_AND_FIVE_MINUTES;
    }
  },
  33: {
      title: 'I h4v3 1337 5ki11z',
    description: 'Answer "nope" in 13 minutes and 37 seconds',
    hasEarned: function(user, nopeData) {
      return nopeData.timeDiff >= LEET_SECONDS &&
        nopeData.timeDiff < LEET_PLUS_ONE_SECONDS;
    }
  },
  34: {
    title: 'h4x0r',
    description: 'Answer "nope" in 13 hours and 37 minutes',
    hasEarned: function(user, nopeData) {
      return nopeData.timeDiff >= LEET_MINUTES &&
        nopeData.timeDiff < LEET_PLUS_ONE_MINUTES;
    }
  }
};

var achievableByNopingIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 19, 20, 21, 22, 23, 24, 31, 32, 33, 34];
var achievableByNewFriendsIds = [16, 17, 18, 22, 23, 24];
var achievableByVictoryDefeat = [25, 26, 27, 28];
var achievableByTruce = [29, 30];

function hasEarnedTotalNopes(nopesToObtain, user) {
  return user.totalNopes >= nopesToObtain;
}

function hasEarnedOpponentNopes(nopesToObtain, user, nopeData) {
  return nopeData.nopesCpt >= nopesToObtain;
}

// Refactor this
module.exports = {
  earnedAfterNoping: function(user, nopeData) {
    return achievableByNopingIds.filter(function(achievementId) {
      if (user.achievements[achievementId]) return false; // Already earned
      return achievements[achievementId].hasEarned(user, nopeData);
    });
  },

  earnedAfterNewFriends: function(user) {
    return achievableByNewFriendsIds.filter(function(achievementId) {
      if (user.achievements[achievementId]) return false; // Already earned
      return achievements[achievementId].hasEarned(user);
    });
  },

  earnedAfterTruce: function(user, nopeData) {
    return achievableByTruce.filter(function(achievementId) {
      if (user.achievements[achievementId]) return false; // Already earned
      return achievements[achievementId].hasEarned(user, nopeData);
    });
  },

  earnedAfterVictoryOrDefeat: function(user, nopeData) {
    return achievableByVictoryDefeat.filter(function(achievementId) {
      if (user.achievements[achievementId]) return false; // Already earned
      return achievements[achievementId].hasEarned(user);
    });
  },
};
