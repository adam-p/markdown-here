/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*global chrome:false, markdownHere:false, CommonLogic:false, htmlToText:false,
    Utils:false, MdhHtmlToText:false, marked:false*/
/*jshint devel:true, browser:true*/


/*
 * Chrome-specific code for responding to the context menu item and providing
 * rendering services.
 */


// Handle the menu-item click
function requestHandler(request, sender, sendResponse) {
  var focusedElem, mdReturn;

  if (request && (request.action === 'context-click' ||
                  request.action === 'hotkey' ||
                  request.action === 'button-click')) {

    // Check if the focused element is a valid render target
    focusedElem = markdownHere.findFocusedElem(window.document);
    if (!focusedElem) {
      // Shouldn't happen. But if it does, just silently abort.
      return false;
    }

    if (!markdownHere.elementCanBeRendered(focusedElem)) {
      alert(Utils.getMessage('invalid_field'));
      return false;
    }

    var logger = function() { console.log.apply(console, arguments); };

    mdReturn = markdownHere(
                document,
                requestMarkdownConversion,
                logger,
                markdownRenderComplete);

    if (typeof(mdReturn) === 'string') {
      // Error message was returned.
      alert(mdReturn);
      return false;
    }
  }
  else if (request && request.action === 'show-upgrade-notification')
  {
    sendResponse(true);
    showUpgradeNotification(request.html);
    return false;
  }
  else if (request && request.action === 'clear-upgrade-notification')
  {
    clearUpgradeNotification();
    return false;
  }
}
chrome.extension.onMessage.addListener(requestHandler);


// The rendering service provided to the content script.
// See the comment in markdown-render.js for why we do this.
function requestMarkdownConversion(elem, range, callback) {
  var mdhHtmlToText = new MdhHtmlToText.MdhHtmlToText(elem, range);

  // Send a request to the add-on script to actually do the rendering.
  Utils.makeRequestToPrivilegedScript(
    document,
    { action: 'render', mdText: mdhHtmlToText.get() },
    function(response) {
      var renderedMarkdown = mdhHtmlToText.postprocess(response.html);
      callback(renderedMarkdown, response.css);
    });
}


// When rendering (or unrendering) completed, do our interval checks.
function markdownRenderComplete(elem, rendered) {
  intervalCheck(elem);
}


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
// interval too small. I already find this approach distasteful.) The focus
// event does actually work for the new Chrome+Gmail interface, which is an
// important target.
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
  Utils.makeRequestToPrivilegedScript(
    document,
    { action: 'show-toggle-button', show: show });
}


var lastElemChecked, lastRenderable;
function setToggleButtonVisibility(elem) {
  var renderable = false;

  // Assumption: An element does not change renderability.
  if (elem === lastElemChecked) {
    return;
  }
  lastElemChecked = elem;

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


function buttonIntervalCheck(focusedElem) {
  setToggleButtonVisibility(focusedElem);
}


/*
 * Hotkey support
 */

// Default the hotkey check to a no-op until we get the necessary info from the
// user options.
var hotkeyIntervalCheck = function(focusedElem) {};
var hotkeyGetOptionsHandler = function(prefs) {
  // If the background script isn't properly loaded, it can happen that the
  // `prefs` argument is undefined. Detect this and try again.
  if (typeof(prefs) === 'undefined') {
    Utils.makeRequestToPrivilegedScript(
      document,
      { action: 'get-options' },
      hotkeyGetOptionsHandler);
    return;
  }

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

    // The actual hotkey event handler.
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

    // The hotkey option is enabled, and we've created our event handler function,
    // so now let's do real hotkey interval checking.
    hotkeyIntervalCheck = function(focusedElem) {
      if (focusedElem.ownerDocument) {
        focusedElem = focusedElem.ownerDocument;
      }

      // TODO: Chrome and Mozilla: Only add a hotkey handler on pages/iframes that
      // are valid targets. And/or let the hotkey match if the correct type of
      // control has focus.

      focusedElem.addEventListener('keydown', hotkeyHandler, true);
    };
  }
  // else the hotkey is disabled and we'll leave hotkeyIntervalCheck as a no-op
};
Utils.makeRequestToPrivilegedScript(
  document,
  { action: 'get-options' },
  hotkeyGetOptionsHandler);


/*
 * Interval checks
 * See specific sections above for reasons why this is necessary.
 */

var forgotToRenderIntervalCheckPrefs = null;

// `elem` is optional. If not provided, the focused element will be checked.
function intervalCheck(elem) {
  var focusedElem = elem || markdownHere.findFocusedElem(window.document);
  if (!focusedElem) {
    return;
  }

  hotkeyIntervalCheck(focusedElem);
  buttonIntervalCheck(focusedElem);

  // Don't retrieve options every time. Doing so was probably causing the memory
  // leak of #108 and the errors of #113.
  if (!forgotToRenderIntervalCheckPrefs) {
    Utils.makeRequestToPrivilegedScript(
      document,
      { action: 'get-options' },
      function(prefs) {
        forgotToRenderIntervalCheckPrefs = prefs;
      });
  }
  else {
    CommonLogic.forgotToRenderIntervalCheck(
      focusedElem,
      markdownHere,
      MdhHtmlToText,
      marked,
      forgotToRenderIntervalCheckPrefs);
  }
}
setInterval(intervalCheck, 2000);


/*
 * Upgrade notification
 */

function showUpgradeNotification(html) {
  if (document.querySelector('#markdown-here-upgrade-notification-content')) {
    return;
  }

  var elem = document.createElement('div');
  document.body.appendChild(elem);
  Utils.saferSetOuterHTML(elem, html);

  // Note that `elem` is no longer valid after we call Utils.saferSetOuterHTML on it.

  // Add click handlers so that we can clear the notification.
  var optionsLink = document.querySelector('#markdown-here-upgrade-notification-link');
  optionsLink.addEventListener('click', function(event) {
    clearUpgradeNotification(true);

    // Only the background script can open the options page tab (without a
    // bunch of extra permissions and effort).
    Utils.makeRequestToPrivilegedScript(
      document,
      { action: 'open-tab', url: optionsLink.getAttribute('href') });

    event.preventDefault();
  });

  var closeLink = document.querySelector('#markdown-here-upgrade-notification-close');
  closeLink.addEventListener('click', function(event) {
    event.preventDefault();
    clearUpgradeNotification(true);
  });
}

function clearUpgradeNotification(notifyBackgroundScript) {
  if (notifyBackgroundScript) {
    Utils.makeRequestToPrivilegedScript(
      document,
      { action: 'upgrade-notification-shown' });
  }

  var elem = document.querySelector('#markdown-here-upgrade-notification-content');
  if (elem) {
    document.body.removeChild(elem);
  }
}
