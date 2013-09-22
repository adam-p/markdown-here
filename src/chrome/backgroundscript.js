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

      var optionsURL = '/common/options.html';

      if (typeof(options['last-version']) === 'undefined') {
        // This is the very first time the extensions has been run, so show the
        // options page.
        chrome.tabs.create({ url: chrome.extension.getURL(optionsURL) });

        // Update our last version
        OptionsStore.set({ 'last-version': appDetails.version });
      }
      else if (options['last-version'] !== appDetails.version) {
        // The extension has been newly updated
        optionsURL += '?prevVer=' + options['last-version'];

        showUpgradeNotification(chrome.extension.getURL(optionsURL));

        // Update our last version
        OptionsStore.set({ 'last-version': appDetails.version });
      }
    });
  }, false);

// Create the context menu that will signal our main code.
chrome.contextMenus.create({
  contexts: ['editable'],
  title: 'Mar&kdown Toggle',
  onclick: function(info, tab) {
    chrome.tabs.sendMessage(tab.id, {action: 'context-click'});
  }
});

// Handle rendering requests from the content script.
// See the comment in markdown-render.js for why we do this.
chrome.runtime.onMessage.addListener(function(request, sender, responseCallback) {
  // The content script can load in a not-real tab (like the search box), which
  // has a tab.id of -1. We should just ignore these pages.
  if (sender.tab.id < 0) {
    return false;
  }

  if (request.action === 'render') {
    OptionsStore.get(function(prefs) {
      responseCallback({
        html: markdownRender(
          prefs,
          htmlToText,
          marked,
          hljs,
          request.html,
          document,
          sender.tab.url),
        css: (prefs['main-css'] + prefs['syntax-css'])
      });
    });
    return true;
  }
  else if (request.action === 'get-options') {
    OptionsStore.get(function(prefs) { responseCallback(prefs); });
    return true;
  }
  else if (request.action === 'show-toggle-button') {
    if (request.show) {
      chrome.browserAction.enable(sender.tab.id);
      return false;
    }
    else {
      chrome.browserAction.disable(sender.tab.id);
      return false;
    }
  }
  else if (request.action === 'upgrade-notification-shown') {
    clearUpgradeNotification();
    return false;
  }
  else if (request.action === 'get-forgot-to-render-prompt') {
    CommonLogic.getForgotToRenderPrompt(responseCallback);
    return true;
  }
  else {
    console.log('unmatched request action');
    console.log(request.action);
    throw 'unmatched request action: ' + request.action;
    return false;
  }
});

// Add the browserAction (the button in the browser toolbar) listener.
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.sendMessage(tab.id, {action: 'button-click', });
});


/*
Showing an notification after upgrade is complicated by the fact that the
background script can't communicate with "stale" content scripts. (See https://code.google.com/p/chromium/issues/detail?id=168263)
So, content scripts need to be reloaded before they can receive the "show
upgrade notification message". So we're going to keep sending that message from
the background script until a content script acknowledges it. (Content scripts
will acknowledge when the user clicks the notification.)
*/
var showUpgradeNotificationInterval = null;
function showUpgradeNotification(optionsURL) {
  // Get the content of notification element
  var xhr = new XMLHttpRequest();
  xhr.overrideMimeType('text/html');
  xhr.open('GET', chrome.extension.getURL('/common/upgrade-notification.html'));
  xhr.onreadystatechange = function() {
    if (this.readyState === this.DONE) {
      // Assume 200 OK -- it's just a local call
      var html = this.responseText;

      // Get the logo image data
      var xhr = new XMLHttpRequest();
      xhr.open('GET', chrome.extension.getURL('/common/images/icon16.png'));

      xhr.responseType = 'arraybuffer';

      xhr.onload = function(e) {
        if (this.readyState === this.DONE) {
          // Assume 200 OK -- it's just a local call
          var uInt8Array = new Uint8Array(this.response);
          var i = uInt8Array.length;
          var binaryString = new Array(i);
          while (i--)
          {
            binaryString[i] = String.fromCharCode(uInt8Array[i]);
          }
          var data = binaryString.join('');

          var logoBase64 = window.btoa(data);

          // Do some rough template replacement
          html = html.replace('{{optionsURL}}', optionsURL)
                     .replace('{{logoBase64}}', logoBase64);

          var askTabsToShowNotification = function() {
            chrome.tabs.query({windowType: 'normal'}, function(tabs) {
              for (var i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(
                  tabs[i].id,
                  { action: 'show-upgrade-notification', html: html });
              }
            });
          };

          showUpgradeNotificationInterval = setInterval(askTabsToShowNotification, 5000);
        }
      };

      xhr.send();
    }
  };
  xhr.send();
}

function clearUpgradeNotification() {
  if (showUpgradeNotificationInterval) {
    clearInterval(showUpgradeNotificationInterval);
    showUpgradeNotificationInterval = null;

    chrome.tabs.query({windowType: 'normal'}, function(tabs) {
      for (var i = 0; i < tabs.length; i++) {
        chrome.tabs.sendMessage(
          tabs[i].id,
          { action: 'clear-upgrade-notification' });
      }
    });
  }
}
