/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Chrome background script.
 */

// On each load, check if we should show the options/changelist page.
window.addEventListener('load', function() {
    OptionsStore.get(function(options) {
      var appDetails = chrome.app.getDetails();

      // Have we been updated?
      if (options['last-version'] !== appDetails.version) {
        // Open our options page in changelist mode
        chrome.tabs.create({ url: appDetails.options_page + "#changelist" });

        // Update out last version
        OptionsStore.set({ 'last-version': appDetails.version });
      }
    });
  }, false);

// Create the context menu that will signal our main code.
chrome.contextMenus.create({
  contexts: ['editable'],
  title: 'Mar&kdown Toggle',
  onclick: function(info, tab) {
    chrome.tabs.sendRequest(tab.id, {action: 'context-click'});
  }
});

// Handle rendering requests from the content script.
// See the comment in markdown-render.js for why we do this.
chrome.extension.onRequest.addListener(function(request, sender, responseCallback) {
  if (request.action === 'render') {
    OptionsStore.get(function(prefs) {
      responseCallback({
        html: markdownRender(
          prefs,
          htmlToText,
          marked,
          hljs,
          request.html,
          document),
        css: (prefs['main-css'] + prefs['syntax-css'])
      });
    });
  }
  else if (request.action === 'get-options') {
    OptionsStore.get(function(prefs) { responseCallback(prefs); });
  }
  else {
    console.log('unmatched request action');
    console.log(action);
    throw 'unmatched request action: ' + action;
  }
});
