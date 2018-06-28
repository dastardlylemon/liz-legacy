import $ from 'jquery';
import _ from 'underscore';

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

$(document).ready(() => {
  convertLinks($('#stream-items-id'));
  const observer = new MutationObserver((mutations) => {
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

  observer.observe($('#stream-items-id')[0], config);
});

// also eventually hidden divs from the DOM
