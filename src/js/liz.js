import $ from 'jquery';
import _ from 'underscore';
import * as twitter from 'twitter-text';

import settingsTab from '../templates/settings-tab.template';
import settingsPanel from '../templates/settings-panel.template';

const liz = {
  MAX_TWEET_LENGTH: 280,
  INITIALIZED_CLASS: 'liz-initialized',

  composerText: '',

  registeredStyles: [
    'settings',
    'square-avatars',
    'hide-moments',
    'hide-who-to-follow',
    'liked-tweets',
    'promoted-tweets',
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
      const tweetText = $(mutation.target.parentElement).text();
      let composer = $(mutation.target.parentElement).closest('.RichEditor-container');
      let counter = composer.find('.liz-character-counter');
      let { weightedLength } = twitter.parseTweet(tweetText);
      if (tweetText.trim().length === 0) {
        weightedLength = 0;
      }
      counter.text(this.MAX_TWEET_LENGTH - weightedLength);
      counter.toggleClass('maxReached', weightedLength >= this.MAX_TWEET_LENGTH);
    }
  },

  insertTweetCounter: function(context) {
    if (!context.hasClass(this.INITIALIZED_CLASS)) {
      const counterEl = $('<div/>', {
        class: 'liz-character-counter'
      });
      counterEl.insertBefore(
        context.closest('.RichEditor-container').find('.js-character-counter')
      );
      context.addClass(this.INITIALIZED_CLASS);
    }
  },

  insertSettingsTab: function(active = false) {
    let settingsNav = $('#settings_nav .js-nav-links');
    if (!settingsNav.hasClass(this.INITIALIZED_CLASS)) {
      settingsNav.append(settingsTab(active));
      settingsNav.addClass(this.INITIALIZED_CLASS);
    }
  },

  initializeGeneral: function() {
    const composer = $('#tweet-box-global');
    this.insertTweetCounter(composer);
    this.initializeObserver(composer[0], 'composer', {
      characterData: true,
      attributes: false,
      childList: true,
      subtree: true
    });
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

  initializeTweetDetailPage: function() {
    const path = window.location.pathname;
    const tweetId = path.split('/').pop();

    const composer = $(`#tweet-box-reply-to-${tweetId}`);
    this.insertTweetCounter(composer);
    this.initializeObserver(composer[0], 'composer', {
      characterData: true,
      attributes: false,
      childList: true,
      subtree: true
    });
  },

  initializeSettingsPage: function() {
    this.insertSettingsTab();
    const lizTab = $('#liz_dashboard_nav');
    $('#page-container').append(settingsPanel());
    $('.js-nav-links li').on('click', (e) => {
      if ($(e.currentTarget).is('#liz_dashboard_nav')) {
        e.preventDefault();
        $('li.active').removeClass('active');
        lizTab.addClass('active');
        $('.content-main').hide();
        $('.liz-settings').show();
      } else {
        lizTab.removeClass('active');
        $('.content-main').show();
        $('.liz-settings').hide();
      }
    });
  },

  onReady: function() {
    chrome.runtime.onMessage.addListener(
      (message, callback) => {
        if (message.type === 'update:url') {
          _.invoke(this.activeObservers, 'disconnect');
          this.activeObservers = [];
          console.log('HELLO', message.url);
          this.initializeGeneral();

          if (/twitter\.com\/$/.test(message.url)) {
            this.initializeHomePage();
          } else if (/twitter\.com\/[a-zA-Z0-9_]+\/status\/\d+$/.test(message.url)) {
            this.initializeTweetDetailPage();
          } else if (/twitter\.com\/(settings|who_to_follow)\/[a-zA-Z0-9_]+/.test(message.url)) {
            this.initializeSettingsPage();
          } else {
            console.log('all patterns failed');
          }
        }
      }
    );

    this.registerObserver('timeline', this.convertLinksCallback);
    this.registerObserver('composer', this.updateTweetCounter);
    this.initializeGeneral();
    this.initializeHomePage();
    // this.initializeSettingsPage();
  }
};

liz.insertStyles();

$(document).ready(() => {
  liz.onReady.call(liz);
});

// also eventually hidden divs from the DOM
