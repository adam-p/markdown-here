/*
 * Copyright Adam Pritchard 2016
 * MIT License : https://adampritchard.mit-license.org/
 */

"use strict";
/*global chrome:false, OptionsStore:false, MarkdownRender:false,
  marked:false, hljs:false, Utils:false, CommonLogic:false */
/*jshint devel:true, browser:true*/

if (typeof browser === "undefined") {
  // Chrome does not support the browser namespace yet.
  // See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background
  globalThis.browser = chrome;
}

// We supply a #hash to the background page, so that we know when we're
// loaded via `background.page` (manifest V2 and Firefox manifest V3) vs
// `background.service_worker` (manifest V3 in Chrome and Safari).
var backgroundPage = !!location.hash;

if (!backgroundPage) {
  // When loaded via a background page, the support scripts are already
  // present. When loaded via a service worker, we need to import them.
  // (`importScripts` is only available in service workers.)
  importScripts('../common/utils.js');
  importScripts('../common/common-logic.js');
  importScripts('../common/marked.js');
  importScripts('../common/highlightjs/highlight.js');
  importScripts('../common/markdown-render.js');
  importScripts('../common/options-store.js');
}

// Note that this file is both the script for a background page _and_ for a service
// worker. The way these things work are quite different, and we must be cognizant of that
// while writing this file.
//
// The key difference is that a background page is loaded once per browser session; a
// service worker is loaded when extension-related events occur, and then is torn down
// after 30 seconds of inactivity (with lifecycle caveats). This means that we can't rely
// on global variables to store state, and we must be mindful about how we handle
// messages.

// For the background page, this listener is added once and remains active for the browser
// session; for the service worker, this listener is added every time the service worker
// is loaded, and is torn down when the service worker is torn down.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== 'install' && details.reason !== 'update') {
    return;
  }

  // Create the context menu that will signal our main code.
  // This must be called only once, when installed or updated, so we do it here.
  chrome.contextMenus.create({
    id: 'markdown-here-context-menu',
    contexts: ['editable'],
    title: Utils.getMessage('context_menu_item')
  });

  // Note: If we find that the upgrade info page opens too often, we may
  // need to add delays. See: https://github.com/adam-p/markdown-here/issues/119
  upgradeCheck();
});

function upgradeCheck() {
  OptionsStore.get(function(options) {
    var appManifest = chrome.runtime.getManifest();

    var optionsURL = '/common/options.html';

    if (typeof(options['last-version']) === 'undefined') {
      // Update our last version. Only when the update is complete will we take
      // the next action, to make sure it doesn't happen every time we start up.
      OptionsStore.set({ 'last-version': appManifest.version }, function() {
        // This is the very first time the extensions has been run, so show the
        // options page.
        chrome.tabs.create({ url: chrome.runtime.getURL(optionsURL) });
      });
    }
    else if (options['last-version'] !== appManifest.version) {
      // Update our last version. Only when the update is complete will we take
      // the next action, to make sure it doesn't happen every time we start up.
      OptionsStore.set({ 'last-version': appManifest.version }, function() {
        // The extension has been newly updated
        optionsURL += '?prevVer=' + options['last-version'];

        showUpgradeNotification(chrome.runtime.getURL(optionsURL));
      });
    }
  });
}

// Handle context menu clicks.
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  chrome.tabs.sendMessage(tab.id, {action: 'context-click'});
});

// Handle rendering requests from the content script. Note that incoming messages will
// revive the service worker, then process the message, then tear down the service worker.
// See the comment in markdown-render.js for why we use these requests.
chrome.runtime.onMessage.addListener(function(request, sender, responseCallback) {
  // The content script can load in a not-real tab (like the search box), which
  // has an invalid `sender.tab` value. We should just ignore these pages.
  if (typeof(sender.tab) === 'undefined' ||
      typeof(sender.tab.id) === 'undefined' || sender.tab.id < 0) {
    return false;
  }

  if (request.action === 'render') {
    OptionsStore.get(function(prefs) {
      responseCallback({
        html: MarkdownRender.markdownRender(
          request.mdText,
          prefs,
          marked,
          hljs),
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
      chrome.action.enable(sender.tab.id);
      chrome.action.setTitle({
        title: Utils.getMessage('toggle_button_tooltip'),
        tabId: sender.tab.id });
      chrome.action.setIcon({
        path: {
          "16": Utils.getLocalURL('/common/images/icon16-button-monochrome.png'),
          "19": Utils.getLocalURL('/common/images/icon19-button-monochrome.png'),
          "32": Utils.getLocalURL('/common/images/icon32-button-monochrome.png'),
          "38": Utils.getLocalURL('/common/images/icon38-button-monochrome.png'),
          "64": Utils.getLocalURL('/common/images/icon64-button-monochrome.png')
        },
        tabId: sender.tab.id });
      return false;
    }
    else {
      chrome.action.disable(sender.tab.id);
      chrome.action.setTitle({
        title: Utils.getMessage('toggle_button_tooltip_disabled'),
        tabId: sender.tab.id });
      chrome.action.setIcon({
        path: {
          "16": Utils.getLocalURL('/common/images/icon16-button-disabled.png'),
          "19": Utils.getLocalURL('/common/images/icon19-button-disabled.png'),
          "32": Utils.getLocalURL('/common/images/icon32-button-disabled.png'),
          "38": Utils.getLocalURL('/common/images/icon38-button-disabled.png'),
          "64": Utils.getLocalURL('/common/images/icon64-button-disabled.png')
        },
        tabId: sender.tab.id });
      return false;
    }
  }
  else if (request.action === 'upgrade-notification-shown') {
    clearUpgradeNotification();
    return false;
  }
  else if (request.action === 'get-forgot-to-render-prompt') {
    CommonLogic.getForgotToRenderPromptContent(function(html) {
      responseCallback({html: html});
    });
    return true;
  }
  else if (request.action === 'open-tab') {
    chrome.tabs.create({
        'url': request.url
    });
    return false;
  }
  else if (request.action === 'test-request') {
    responseCallback('test-request-good');
    return false;
  }
  else {
    console.log('unmatched request action', request.action);
    throw 'unmatched request action: ' + request.action;
  }
});

// Add the browserAction (the button in the browser toolbar) listener.
chrome.action.onClicked.addListener(function(tab) {
  chrome.tabs.sendMessage(tab.id, {action: 'button-click', });
});


/*
Showing an notification after upgrade is complicated by the fact that the
background script can't communicate with "stale" content scripts. (See https://code.google.com/p/chromium/issues/detail?id=168263)
So, content scripts need to be reloaded before they can receive the "show
upgrade notification message". So we're going to keep sending that message from
the background script until a content script acknowledges it.
*/
var showUpgradeNotificationInterval = null;
function showUpgradeNotification(optionsURL) {
  // Get the content of notification element
  CommonLogic.getUpgradeNotification(optionsURL, function(html) {
    var tabGotTheMessage = function(gotIt) {
      // From tabs that haven't been reloaded, this will get called with no arguments.
      if (!gotIt) {
        return;
      }

      // As soon as any content script gets the message, stop trying
      // to send it.
      // NOTE: This could result in under-showing the notification, but that's
      // better than over-showing it (e.g., issue #109).
      if (showUpgradeNotificationInterval !== null) {
        clearInterval(showUpgradeNotificationInterval);
        showUpgradeNotificationInterval = null;
      }
    };

    var askTabsToShowNotification = function() {
      chrome.tabs.query({windowType: 'normal'}, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
          chrome.tabs.sendMessage(
            tabs[i].id,
            { action: 'show-upgrade-notification', html: html },
            tabGotTheMessage);
        }
      });
    };

    // TODO: This interval won't keep the service worker alive, so if a content script
    // doesn't reload in about 30 seconds, we'll lose the interval and the notification
    // won't show.
    // Maybe use the Alarms API? Maybe restructure this so that it's less hacky?
    showUpgradeNotificationInterval = setInterval(askTabsToShowNotification, 5000);
  });
}

function clearUpgradeNotification() {
  if (showUpgradeNotificationInterval !== null) {
    clearInterval(showUpgradeNotificationInterval);
    showUpgradeNotificationInterval = null;
  }

  chrome.tabs.query({windowType: 'normal'}, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      chrome.tabs.sendMessage(
        tabs[i].id,
        { action: 'clear-upgrade-notification' });
    }
  });
}
