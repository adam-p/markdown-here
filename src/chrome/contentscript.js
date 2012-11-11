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

  if (event && (event.action === 'context-click' ||
                event.action === 'hotkey' ||
                event.action === 'button-click')) {

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


/*
 * Show/hide the toggle button.
 */

// We're going to show the button depending on whether the currently focused
// element is renderable or not. We'll keep track of what's "currently
// focused" in two ways:
//   1) Handling `focus` events. But that doesn't work for iframes, so we also
//      need...
//   2) An interval timer. Every so often we'll check the current focus.
//
// In principle, the #2 is sufficient by itself, but it's nice to have the
// immediate response of #1 where possible. (And I hesitate to make the timer
// interval too small. I already find this approach distasteful.)
//
// The problem with iframes is that they don't get focus/blur events when
// moving between iframes.
//
// Regarding the `focus` event: Chrome seems to give us (bubbling) focus
// events if `useCapture` is true. Firefox doesn't seem to give us focus
// events at all (and it doesn't provide `focusin` or `DOMFocusIn`). So on FF
// we're basically relaying entirely on the interval checks.

// At this time, only this function differs between Chrome and Firefox.
function showToggleButton(show) {
  chrome.extension.sendRequest({ action: 'show-page-action', show: show });
}

var lastRenderable;
function setToggleButtonVisibility(elem) {
  var renderable = false;

  if (elem && elem.ownerDocument) {
    // We may have gotten here via the timer, so we'll add an event handler.
    // Setting the event handler like this lets us better deal with iframes.
    // It's okay to call `addEventListener` more than once with the exact same
    // arguments.
    elem.ownerDocument.addEventListener('focus', focusChange, true);

    renderable = markdownHere.elementCanBeRendered(elem);
  }

  if (renderable !== lastRenderable) {
    showToggleButton(renderable);
    lastRenderable = renderable;
  }
}

// When the focus in the page changes, check if the newly focused element is
// a valid Markdown Toggle target.
function focusChange(event) {
  setToggleButtonVisibility(event.target);
}
window.document.addEventListener('focus', focusChange, true);

// We're using a function expression rather than a function declaration
// because Mozilla's automatic extension review prefers when you pass the
// former to `setInterval()`.
var intervalCheck = function() {
  var focusedElem = markdownHere.findFocusedElem(window.document);
  setToggleButtonVisibility(focusedElem);
};
setInterval(intervalCheck, 2000);
