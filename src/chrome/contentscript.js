/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*global chrome:false, markdownHere:false*/
/*jshint devel:true, browser:true*/


/*
 * Chrome-specific code for responding to the context menu item and providing
 * rendering services.
 */

// Handle the menu-item click
function requestHandler(event) {
  var focusedElem, mdReturn;

  if (event && (event.action === 'context-click' || event.action === 'hotkey')) {

    // Check if the focused element is a valid render target
    focusedElem = markdownHere.findFocusedElem(window.document);
    if (!markdownHere.elementCanBeRendered(focusedElem)) {
      alert('The selected field is not valid for Markdown rendering. Please use a rich editor.');
      return;
    }

    var logger = function() { console.log.apply(console, arguments); };

    mdReturn = markdownHere(document, requestMarkdownConversion, logger);

    if (typeof(mdReturn) === 'string') {
      // Error message was returned.
      alert(mdReturn);
      return;
    }
  }
}
chrome.extension.onRequest.addListener(requestHandler);

// The rendering service provided to the content script.
// See the comment in markdown-render.js for why we do this.
function requestMarkdownConversion(html, callback) {
  // Send a request to the add-on script to actually do the rendering.
  chrome.extension.sendRequest({action: 'render', html: html}, function(response) {
    callback(response.html, response.css);
  });
}

// Register a hotkey listener
chrome.extension.sendRequest({action: 'get-options'}, function(prefs) {
  // Only add a listener if a key is set
  if (prefs.hotkey.key.length === 1) {

    // HACK: In Chrome, we have to add a keydown listener to every iframe of interest,
    // otherwise the handler will only fire on the topmost window. It's difficult
    // to iterate (recursively) through iframes and add listeners to them (especially
    // for Yahoo, where there isn't a page change when the compose window appears,
    // so this content script doesn't get re-run). Instead we're going to use the
    // dirty hack of checking every few seconds if the user has focused a new iframe
    // and adding a handler to it.
    // Note that this will result in addEventListener being called on the same
    // iframe/document repeatedly, but that's okay -- duplicate handlers are discarded.
    // https://developer.mozilla.org/en-US/docs/DOM/element.addEventListener#Multiple_identical_event_listeners

    var hotkeyHandler = function(event) {
      if (event.shiftKey === prefs.hotkey.shiftKey &&
          event.ctrlKey === prefs.hotkey.ctrlKey &&
          event.altKey === prefs.hotkey.altKey &&
          event.which === prefs.hotkey.key.toUpperCase().charCodeAt(0)) {
        requestHandler({action: 'hotkey'});
        event.preventDefault();
        return false;
      }
    };

    setInterval(function() {
      var focusedElem = document.activeElement;

      // If the focus is within an iframe, we'll have to drill down.
      while (focusedElem && focusedElem.contentDocument) {
        focusedElem = focusedElem.contentDocument.activeElement;
      }

      if (focusedElem.ownerDocument) {
        focusedElem = focusedElem.ownerDocument;
      }

      // TODO: Chrome and Mozilla: Only add a hotkey handler on pages/iframes that
      // are valid targets. And/or let the hotkey match if the correct type of
      // control has focus.

      focusedElem.addEventListener('keydown', hotkeyHandler, false);
    }, 3000);
  }
});
