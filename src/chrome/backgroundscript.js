/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*global chrome:false, OptionsStore:false, MarkdownRender:false,
  marked:false, hljs:false, Utils:false, CommonLogic:false */
/*jshint devel:true, browser:true*/

/*
 * Chrome background script.
 */

// On each load, check if we should show the options/changelist page.
function onLoad() {
  // This timeout is a dirty hack to fix bug #119: "Markdown Here Upgrade
  // Notification every time I open Chrome". That issue on Github for details.
  // https://github.com/adam-p/markdown-here/issues/119
  window.setTimeout(upgradeCheck, 30000);
}

// In the interest of improved browser load performace, call `onLoad` after a tick.
window.addEventListener('load', Utils.nextTickFn(onLoad), false);

function upgradeCheck() {
  OptionsStore.get(function(options) {
    var appDetails = chrome.app.getDetails();

    var optionsURL = '/common/options.html';

    if (typeof(options['last-version']) === 'undefined') {
      // Update our last version. Only when the update is complete will we take
      // the next action, to make sure it doesn't happen every time we start up.
      OptionsStore.set({ 'last-version': appDetails.version }, function() {
        // This is the very first time the extensions has been run, so show the
        // options page.
        chrome.tabs.create({ url: chrome.extension.getURL(optionsURL) });
      });
    }
    else if (options['last-version'] !== appDetails.version) {
      // Update our last version. Only when the update is complete will we take
      // the next action, to make sure it doesn't happen every time we start up.
      OptionsStore.set({ 'last-version': appDetails.version }, function() {
        // The extension has been newly updated
        optionsURL += '?prevVer=' + options['last-version'];

        showUpgradeNotification(chrome.extension.getURL(optionsURL));
      });
    }
  });
}

// Create the context menu that will signal our main code.
chrome.contextMenus.create({
  contexts: ['editable'],
  title: Utils.getMessage('context_menu_item_with_shortcut'),
  onclick: function(info, tab) {
    chrome.tabs.sendMessage(tab.id, {action: 'context-click'});
  }
});

// Handle rendering requests from the content script.
// See the comment in markdown-render.js for why we do this.
chrome.extension.onMessage.addListener(function(request, sender, responseCallback) {
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
      chrome.browserAction.enable(sender.tab.id);
      chrome.browserAction.setTitle({
        title: Utils.getMessage('toggle_button_tooltip'),
        tabId: sender.tab.id });
      chrome.browserAction.setIcon({
        path: {
          19: Utils.getLocalURL('/common/images/icon19-button-monochrome.png'),
          38: Utils.getLocalURL('/common/images/icon38-button-monochrome.png')
        },
        tabId: sender.tab.id });
      return false;
    }
    else {
      chrome.browserAction.disable(sender.tab.id);
      chrome.browserAction.setTitle({
        title: Utils.getMessage('toggle_button_tooltip_disabled'),
        tabId: sender.tab.id });
      chrome.browserAction.setIcon({
        path: {
          19: Utils.getLocalURL('/common/images/icon19-button-disabled.png'),
          38: Utils.getLocalURL('/common/images/icon38-button-disabled.png')
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
chrome.browserAction.onClicked.addListener(function(tab) {
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
