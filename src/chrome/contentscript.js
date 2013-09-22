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
      alert('The selected field is not valid for Markdown rendering. Please use a rich editor.');
      return false;
    }

    var logger = function() { console.log.apply(console, arguments); };

    mdReturn = markdownHere(document, requestMarkdownConversion, logger);

    if (typeof(mdReturn) === 'string') {
      // Error message was returned.
      alert(mdReturn);
      return false;
    }
  }
  else if (request && request.action === 'show-upgrade-notification')
  {
    showUpgradeNotification(request.html);
    return false;
  }
  else if (request && request.action === 'clear-upgrade-notification')
  {
    clearUpgradeNotification();
    return false;
  }
}
chrome.runtime.onMessage.addListener(requestHandler);


// The rendering service provided to the content script.
// See the comment in markdown-render.js for why we do this.
function requestMarkdownConversion(html, callback) {
  // Send a request to the add-on script to actually do the rendering.
  chrome.runtime.sendMessage({action: 'render', html: html}, function(response) {
    callback(response.html, response.css);
  });
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
  chrome.runtime.sendMessage({ action: 'show-toggle-button', show: show });
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
    chrome.runtime.sendMessage({action: 'get-options'}, hotkeyGetOptionsHandler);
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

      focusedElem.addEventListener('keydown', hotkeyHandler, false);
    };
  }
  // else the hotkey is disabled and we'll leave hotkeyIntervalCheck as a no-op
};
chrome.runtime.sendMessage({action: 'get-options'}, hotkeyGetOptionsHandler);


/*
 * Interval checks
 * See specific sections above for reasons why this is necessary.
 */

function intervalCheck() {
  var focusedElem = markdownHere.findFocusedElem(window.document);
  if (!focusedElem) {
    return;
  }

  hotkeyIntervalCheck(focusedElem);
  buttonIntervalCheck(focusedElem);
  forgotToRenderIntervalCheck(focusedElem);
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
  optionsLink.addEventListener('click', function() {
    clearUpgradeNotification(true);
    // Allow the default action
  });

  var closeLink = document.querySelector('#markdown-here-upgrade-notification-close');
  closeLink.addEventListener('click', function(event) {
    event.preventDefault();
    clearUpgradeNotification(true);
  });
}

function clearUpgradeNotification(notifyBackgroundScript) {
  var elem = document.querySelector('#markdown-here-upgrade-notification-content');

  if (!elem) {
    return;
  }

  document.body.removeChild(elem);

  if (notifyBackgroundScript) {
    chrome.runtime.sendMessage({action: 'upgrade-notification-shown'});
  }
}


/*
 * Forgot-to-render check
 */

var WATCHED_PROPERTY = 'markdownHereForgotToRenderWatched';
var MARKDOWN_DETECTED_PROPERTY = 'markdownHereForgotToRenderMarkdownDetected';

// This function encapsulates the logic required to prevent accidental sending of
// email that the user wrote in Markdown but forgot to render.
function forgotToRenderIntervalCheck(focusedElem) {
  /*
  There are four(?) ways to send a Gmail email:
   1. Click the Send button. (TODO: Is a touchscreen touch different?)
   2. Put focus on the Send button (with Tab) and hit the Space key.
   3. Put focus on the Send button (with Tab) and hit the Enter key.
   4. With focus in the compose area or subject field,
      press the Ctrl+Enter (Windows, Linux) or ⌘+Enter (OSX) hotkey.
      * For now we're going to ignore the "or subject field" part.
  */

  // There is only logic for GMail (so far)
  if (location.host.indexOf('mail.google.') < 0) {
    return;
  }

  // If focus isn't in the compose body, there's nothing to do
  if (!markdownHere.elementCanBeRendered(focusedElem)) {
    return;
  }

  // If we've already set up watchers for this compose element, skip it.
  if (!focusedElem.hasOwnProperty(WATCHED_PROPERTY)) {
    setupForgotToRenderInterceptors(focusedElem);
    focusedElem[WATCHED_PROPERTY] = true;
  }

  focusedElem[MARKDOWN_DETECTED_PROPERTY] = probablyWritingMarkdown(focusedElem);
}

function setupForgotToRenderInterceptors(composeElem) {
  // This is clearly fragile and will inevitably bring us grief as Google
  // changes the Gmail layout, button labels, etc. But I don't know a better
  // way to do this.
  var elem = composeElem;
  var sendButton = null;
  while (elem = elem.parentElement) {
    sendButton = elem.querySelector('[role="button"][tabindex="1"]');
    if (sendButton) {
      break;
    }
  }

  if (!sendButton) {
    console.log('Markdown Here was unable to find the Gmail "Send" button. Please let the developers know by creating an issue at: https://github.com/adam-p/markdown-here/issues')
    return;
  }

  // NOTE: We are setting the event listeners on the *parent* element of the
  // send button and compose area. This is so that we can capture and prevent
  // propagation to the actual element, thereby preventing Gmail's event
  // listeners from firing.

  var ENTER_KEYCODE = 13;
  var SPACE_KEYCODE = 32;
  var FORGOT_TO_RENDER_PROMPT = "It looks like you've written this email in Markdown and forgot to make it pretty. Send it anyway?";

  var sendButtonKeydownListener = function(event) {
    if (event.target === sendButton
        && (event.keyCode === ENTER_KEYCODE || event.keyCode === SPACE_KEYCODE)
        && composeElem.hasOwnProperty(MARKDOWN_DETECTED_PROPERTY)
        && composeElem[MARKDOWN_DETECTED_PROPERTY]) {
      event.stopPropagation();

      chrome.runtime.sendMessage({action: 'get-forgot-to-render-prompt'}, function(html) {
        showForgotToRenderPrompt(html, composeElem, sendButton);
      });

      return false;
    }
  };

  var sendButtonClickListener = function(event) {
    if (event.target === sendButton
        && !event[Utils.MARKDOWN_HERE_EVENT]
        && composeElem.hasOwnProperty(MARKDOWN_DETECTED_PROPERTY)
        && composeElem[MARKDOWN_DETECTED_PROPERTY]) {
      event.stopPropagation();

      chrome.runtime.sendMessage({action: 'get-forgot-to-render-prompt'}, function(html) {
        showForgotToRenderPrompt(html, composeElem, sendButton);
      });

      return false;
    }
  };

  var sendHotkeyKeydownListener = function(event) {
    // Windows and Linux use Ctrl+Enter and OSX uses ⌘+Enter, so we're going
    // to check for either.
    if (event.target === composeElem
        && (event.metaKey || event.ctrlKey) && event.keyCode === ENTER_KEYCODE
        && composeElem.hasOwnProperty(MARKDOWN_DETECTED_PROPERTY)
        && composeElem[MARKDOWN_DETECTED_PROPERTY]) {
      event.stopPropagation();

      chrome.runtime.sendMessage({action: 'get-forgot-to-render-prompt'}, function(html) {
        showForgotToRenderPrompt(html, composeElem, sendButton);
      });

      return false;
    }
  };

  sendButton.parentElement.addEventListener('keydown', sendButtonKeydownListener, true);
  sendButton.parentElement.addEventListener('click', sendButtonClickListener, true);
  composeElem.parentElement.addEventListener('keydown', sendHotkeyKeydownListener, true);
}

// Returns true if the contents of `composeElem` looks like raw Markdown,
// false otherwise.
function probablyWritingMarkdown(composeElem) {
  /*
  This is going to be tricksy and fraught with danger. Challenges:
    * If it's not sensitive enough, it's useless.
    * If it's too sensitive, users will be super annoyed.
    * Different people write different kinds of Markdown: coders use backticks,
      mathies use dollar signs, normal people don't use either.
    * Being slow would be bad.

  Ways I considered doing this, but discarded:
    * Use Highlight.js's relevance score.
    * Use the size of the array returned by Marked.js's lexer.
    * Render the contents, replace `<p>` tags with newlines, do string distance.

  But I think there are some simple heuristics that will probably be more
  accurate and/or faster.
  */

  // When we actually render, we don't just use `htmlToText()`, but it's good
  // enough for our purposes here.
  var mdMaybe = htmlToText(composeElem.innerHTML);
  // TODO: Exclude blockquotes.

  // Ensure that we're not checking on enormous amounts of text.
  if (mdMaybe.length > 10000) {
    mdMaybe = mdMaybe.slice(0, 10000);
  }

  // TODO: Export regexes from Marked.js instead of copying them.

  // NOTE: It's going to be tempting to use a ton of fancy regexes, but remember
  // that this check is getting run every few seconds, and we don't want to
  // slow down the user's browser.

  // At least two bullet points
  var bulletList = mdMaybe.match(/^[*+-] /mg);
  bulletList = (bulletList && bulletList.length > 1);

  // Backticks == code. Does anyone use backticks for anything else?
  var backticks = mdMaybe.match(/`/);

  // Math
  var math = mdMaybe.match(/\$([^ \t\n\$]([^\$]*[^ \t\n\$])?)\$/);

  // This matches both emphasis and strong Markdown
  var em_strong = mdMaybe.match(/\b_((?:__|[\s\S])+?)_\b|\*((?:\*\*|[\s\S])+?)\*(?!\*)/);

  // Links
  var links = mdMaybe.match(/\[.+\]/);

  return (bulletList || backticks || math || em_strong || links);
}


function showForgotToRenderPrompt(html, composeElem, mailSendButton) {
  if (document.querySelector('#markdown-here-forgot-to-render')) {
    return;
  }

  var elem = document.createElement('div');
  document.body.appendChild(elem);
  Utils.saferSetOuterHTML(elem, html);

  // Note that `elem` is no longer valid after we call Utils.saferSetOuterHTML on it.

  // Set focus to our first button.
  document.querySelector('#markdown-here-forgot-to-render-buttons button').focus();

  // Also add an Escape key handler and other keyboard shortcut disabler.
  // NOTE: If we don't properly remove this in every case that the prompt is
  // dismissed, then we'll break the user's ability to type anything.
  // For some reason this doesn't seem to prevent tabbing, or triggering buttons
  // with space or enter, which is good. (But how can that be?)
  var keyboardCapture = (function() {
    var keyboardCaptureHandler = function(event) {
      event.stopPropagation();
      var ESCAPE_KEY = 27;
      if (event.keyCode === ESCAPE_KEY) {
        dismissPrompt(event.target.ownerDocument, true);
      }
      return false;
    };

    return {
      add: function() {
        return mailSendButton.ownerDocument.body.addEventListener('keydown', keyboardCaptureHandler, true);
      },
      remove: function() {
        return mailSendButton.ownerDocument.body.removeEventListener('keydown', keyboardCaptureHandler, true);
      }
    };
  })();

  var dismissPrompt = function(doc, backToCompose) {
    keyboardCapture.remove();
    var forgotToRenderContent = doc.querySelector('#markdown-here-forgot-to-render');
    if (forgotToRenderContent) {
      doc.body.removeChild(forgotToRenderContent);
    }

    if (backToCompose) {
      composeElem.focus();
    }
  };

  keyboardCapture.add();

  var closeLink = document.querySelector('#markdown-here-forgot-to-render-close');
  closeLink.addEventListener('click', function(event) {
    event.preventDefault();
    dismissPrompt(event.target.ownerDocument, true);
    return false;
  });

  var backButton = document.querySelector('#markdown-here-forgot-to-render-button-back');
  backButton.addEventListener('click', function(event) {
    event.preventDefault();
    dismissPrompt(event.target.ownerDocument, true);
    return false;
  });

  var sendButton = document.querySelector('#markdown-here-forgot-to-render-button-send');
  sendButton.addEventListener('click', function(event) {
    event.preventDefault();
    dismissPrompt(event.target.ownerDocument, false);
    Utils.fireMouseClick(mailSendButton);
    return false;
  });
}
