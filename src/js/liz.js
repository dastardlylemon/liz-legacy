import $ from 'jquery';
import _ from 'underscore';
import * as twitter from 'twitter-text';

const liz = {
  MAX_TWEET_LENGTH: 280,

  composerText: '',

  registeredStyles: [
    'square-avatars',
    'hide-moments',
    'hide-who-to-follow',
    'liked-tweets',
    'small-media',
    'show-links',
    'show-counter'
  ],

  registeredObservers: {
    'timeline': [],
    'composer': []
  },

  insertStyles: function() {
    _.each(this.registeredStyles, (style) => {
      let link = document.createElement('link');
      link.href = chrome.runtime.getURL(`css/${style}.css`);
      link.type = 'text/css';
      link.rel = 'stylesheet';
      document.documentElement.insertBefore(link, null);
    });
  },

  registerStyle: function(style) {
    this.registeredStyles.push(style);
  },

  registerObserver: function(type, callback) {
    this.registeredObservers[type].push(callback);
  },

  initializeObserver: function(context, type, config) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        _.each(this.registeredObservers[type], (callback) => {
          callback.call(this, mutation);
        });
      });
    });
    observer.observe(context, config);
  },

  convertLinks: function(context) {
    const links = context.find('.twitter-timeline-link[data-expanded-url]');
    links.each(function() {
      const sourceUrl = $(this).data('expanded-url');
      $(this).attr('href', sourceUrl);
    });
  },

  convertLinksCallback: function(mutation) {
    if (mutation.addedNodes !== null) {
      this.convertLinks($(mutation.addedNodes));
    }
  },

  updateTweetCounter: function() {
    const tweetText = $('#tweet-box-home-timeline').text();
    if (tweetText !== this.composerText) {
      const { weightedLength } = twitter.parseTweet(tweetText);
      this.counter.text(this.MAX_TWEET_LENGTH - weightedLength);
      this.composerText = tweetText;
      this.counter.toggleClass('maxReached', weightedLength >= this.MAX_TWEET_LENGTH);
    }
  },

  insertTweetCounter: function() {
    const counterEl = $('<div/>', {
      class: 'liz-character-counter'
    });
    counterEl.insertBefore($('.js-character-counter'));
    this.counter = $('.liz-character-counter');
    this.updateTweetCounter();
  },

  onReady: function() {
    this.convertLinks($('#stream-items-id'));
    this.registerObserver('timeline', this.convertLinksCallback);
    this.initializeObserver($('#stream-items-id')[0], 'timeline', {
      attributes: false,
      childList: true,
      subtree: false
    });

    this.insertTweetCounter();
    this.registerObserver('composer', this.updateTweetCounter);
    this.initializeObserver($('#tweet-box-home-timeline')[0], 'composer', {
      characterData: true,
      attributes: false,
      childList: true,
      subtree: true
    });
  }
};

liz.insertStyles();

$(document).ready(() => {
  liz.onReady.call(liz);
});

// also eventually hidden divs from the DOM
