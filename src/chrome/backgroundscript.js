/*
 * Copyright Adam Pritchard 2016
 * MIT License : https://adampritchard.mit-license.org/
 */

"use strict";

/*global chrome:false, OptionsStore:false, MarkdownRender:false,
  marked:false, hljs:false, Utils:false, CommonLogic:false, ContentPermissions:false */
/*jshint devel:true, browser:true*/

if (typeof browser === "undefined") {
  // Chrome does not support the browser namespace yet.
  // See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background
  globalThis.browser = chrome;
}

// We supply a #hash to the background page, so that we know when we're
// loaded via `background.page` (manifest V2 and Firefox manifest V3) vs
// `background.service_worker` (manifest V3 in Chrome).
var backgroundPage = !!location.hash;

if (!backgroundPage) {
  // When loaded via a background page, the support scripts are already
  // present. When loaded via a service worker, we need to import them.
  // (`importScripts` is only available in service workers.)
  importScripts('../common/vendor/dompurify.min.js');
  importScripts('../common/utils.js');
  importScripts('../common/common-logic.js');
  importScripts('../common/marked.js');
  importScripts('../common/highlightjs/highlight.js');
  importScripts('../common/markdown-render.js');
  importScripts('../common/options-store.js');
  importScripts('../common/content-permissions.js');
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
        chrome.tabs.create({ url: Utils.getLocalURL(optionsURL) });
      });
    }
    else if (options['last-version'] !== appManifest.version) {
      // Update our last version. Only when the update is complete will we take
      // the next action, to make sure it doesn't happen every time we start up.
      OptionsStore.set({ 'last-version': appManifest.version }, function() {
        // The extension has been newly updated
        chrome.action.setPopup({ popup: Utils.getLocalURL('/chrome/upgrade-notification-popup.html') }, function() {
          try {
            chrome.action.openPopup();
          } catch (e) {
            // Firefox won't allow us to open a popup programmatically (i.e., in the absence of a user gesture)
            console.error('Failed to open upgrade notification popup:', e);
          }
        });
      });
    }
  });
}

// Handle context menu clicks.
chrome.contextMenus.onClicked.addListener(async function(info, tab) {
  await handleActionClick(tab, info);
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
    throw 'unmatched request action: ' + request.action;
  }
});

// Add the browserAction (the button in the browser toolbar) listener.
// This also handles the _execute_action keyboard command automatically.
chrome.action.onClicked.addListener(async function(tab) {
  await handleActionClick(tab);
});

chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
  // Only proceed when the tab has finished loading and has a valid URL
  if (changeInfo.status === 'complete' && tab.url) {
    // Auto-inject scripts for domains where we already have permission.
    // This allows us to run _before_ the user clicks the button, enabling features
    // such as the "forgot to render" prompt.
    try {
      if (await ContentPermissions.hasPermission(tab.url)) {
        await Injector.injectScripts(tabId);
      }
    } catch (e) {
      // Invalid URL or other error -- just skip
    }
  }
});

// Handle a click on the action button or context menu item
async function handleActionClick(tab, info = undefined) {
  // Check if the current tab is the options page
  const optionsPageUrl = Utils.getLocalURL('/common/options.html');

  if (tab.url && tab.url.startsWith(optionsPageUrl)) {
    // For the options page, send a runtime message directly without injection
    // (because injection won't work on the options page).
    chrome.tabs.sendMessage(tab.id, {
      action: 'button-click',
      info: info
    });
    return true;
  }

  // For all other pages, proceed with the normal injection flow
  const injected = await Injector.injectScripts(tab.id);

  if (!injected) {
    console.error('Failed to inject scripts');
    return false;
  }

  // Send the toggle message
  chrome.tabs.sendMessage(tab.id, {
    action: 'button-click',
    info: info
   });

  return true;
}

const Injector = {
  // Scripts to inject in order
  CONTENT_SCRIPTS: [
    '/common/vendor/dompurify.min.js',
    '/common/utils.js',
    '/common/common-logic.js',
    '/common/jsHtmlToText.js',
    '/common/marked.js',
    '/common/mdh-html-to-text.js',
    '/common/markdown-here.js',
    '/chrome/contentscript.js'
  ],

  // Check if scripts are already injected in a tab and mark that they are. we do these
  // in one step to minimize the potential for race conditions, where there's an attempt
  // to inject the scripts multiple times.
  async checkAndMarkInjected(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {const alreadyInjected = window.markdownHereInjected; window.markdownHereInjected = true; return !!alreadyInjected;}
      });
      return results && results[0] && results[0].result === true;
    } catch (e) {
      // Tab might not be accessible
      return false;
    }
  },

  // Inject content scripts into a tab
  async injectScripts(tabId) {
    try {
      // Check if already injected
      if (await this.checkAndMarkInjected(tabId)) {
        return true;
      }

      // Inject files in order
      for (const script of this.CONTENT_SCRIPTS) {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: [script]
        });
      }

      return true;
    } catch (e) {
      // Note that we're not cleaning up our "injected" flag, nor any of the scripts that
      // might have been injected before the error occurred. An error shouldn't occur,
      // and we'll just give up on working in this tab if it does.
      console.error('Error injecting scripts:', e);
      return false;
    }
  }
};
