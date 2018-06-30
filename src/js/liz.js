import $ from 'jquery';
import _ from 'underscore';
import * as twitter from 'twitter-text';

function insertStyles(type) {
  let link = document.createElement('link');
  link.href = chrome.runtime.getURL(`css/${type}.css`);
  link.type = 'text/css';
  link.rel = 'stylesheet';
  document.documentElement.insertBefore(link, null);
}

insertStyles('square-avatars');
insertStyles('hide-moments');
insertStyles('liked-tweets');
insertStyles('small-media');
insertStyles('show-links');

function convertLinks(context) {
  let links = context.find('.twitter-timeline-link[data-expanded-url]');
  links.each(function() {
    const sourceUrl = $(this).data('expanded-url');
    $(this).attr('href', sourceUrl);
  });
}

function getWeightedLength() {
  const tweetText = $('.timeline-tweet-box .tweet-box-shadow').val();
  const { weightedLength } = twitter.parseTweet(tweetText);
  return weightedLength;
}

function insertTweetCounter() {
  let counter = $('<div/>', {
    class: 'liz-character-counter'
  });
  counter.text(280 - getWeightedLength());
  counter.insertBefore($('.js-character-counter'));
}

$(document).ready(() => {
  convertLinks($('#stream-items-id'));
  const timelineObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes !== null) {
        convertLinks($(mutation.addedNodes));
      }
    });
  });

  const config = {
    attributes: false,
    childList: true,
    subtree: false
  };

  timelineObserver.observe($('#stream-items-id')[0], config);

  insertTweetCounter();
  const composerObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      window.setTimeout(() => {
        $('.liz-character-counter').text(280 - getWeightedLength());
      }, 100);
    });
  });

  const config2 = {
    characterData: true,
    attributes: false,
    childList: false,
    subtree: true
  };

  composerObserver.observe($('#tweet-box-home-timeline')[0], config2);
});

// also eventually hidden divs from the DOM
