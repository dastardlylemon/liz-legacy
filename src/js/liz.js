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

  activeObservers: [],

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
    this.activeObservers.push(observer);
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

  updateTweetCounter: function(mutation) {
    if (mutation.target.parentElement) {
      const tweetText = $('#tweet-box-home-timeline').text();
      if (tweetText !== this.composerText) {
        let composer = $(mutation.target.parentElement).closest('.RichEditor-container');
        let counter = composer.find('.liz-character-counter');
        const { weightedLength } = twitter.parseTweet(tweetText);
        counter.text(this.MAX_TWEET_LENGTH - weightedLength);
        this.composerText = tweetText;
        counter.toggleClass('maxReached', weightedLength >= this.MAX_TWEET_LENGTH);
      }
    }
  },

  insertTweetCounter: function(context) {
    if (!context.hasClass('liz-initialized')) {
      const counterEl = $('<div/>', {
        class: 'liz-character-counter'
      });
      counterEl.insertBefore(
        context.closest('.RichEditor-container').find('.js-character-counter')
      );
      context.addClass('liz-initialized');
    }
  },

  initializeHomePage: function() {
    const timeline = $('#stream-items-id');
    this.convertLinks(timeline);
    this.initializeObserver(timeline[0], 'timeline', {
      attributes: false,
      childList: true,
      subtree: false
    });

    const composer = $('#tweet-box-home-timeline');
    this.insertTweetCounter(composer);
    this.initializeObserver(composer[0], 'composer', {
      characterData: true,
      attributes: false,
      childList: true,
      subtree: true
    });

    $('.ProfileCardStats-statValue').each(function() {
      $(this).text($(this).data('count').toLocaleString());
    });
  },

  onReady: function() {
    chrome.runtime.onMessage.addListener(
      (message, callback) => {
        if (message.type === 'update:url') {
          _.invoke(this.activeObservers, 'disconnect');
          this.activeObservers = [];

          if (message.url === 'https://twitter.com/') {
            this.initializeHomePage();
          }
        }
      }
    );

    this.registerObserver('timeline', this.convertLinksCallback);
    this.registerObserver('composer', this.updateTweetCounter);
    this.initializeHomePage();
  }
};

liz.insertStyles();

$(document).ready(() => {
  liz.onReady.call(liz);
});

// also eventually hidden divs from the DOM
