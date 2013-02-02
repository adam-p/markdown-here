/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*global chrome:false, OptionsStore:false, markdownRender:false,
  htmlToText:false, marked:false, hljs:false*/
/*jshint devel:true*/

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
  else if (request.action === 'show-toggle-button') {
    if (request.show) {
      chrome.browserAction.enable(sender.tab.id);
    }
    else {
      chrome.browserAction.disable(sender.tab.id);
    }
  }
  else {
    console.log('unmatched request action');
    console.log(request.action);
    throw 'unmatched request action: ' + request.action;
  }
});

// Add the browserAction (the button in the browser toolbar) listener.
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.sendRequest(tab.id, {action: 'button-click'});
});
