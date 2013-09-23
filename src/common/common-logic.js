/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Application logic that is common to all (or some) platforms.
 * (And isn't generic enough for utils.js or render-y enough for markdown-render.js,
 * etc.)
 * If this module is being instantiated without a global `window` object being
 * available (providing XMLHttpRequest, for example), then `CommonLogic.global` must
 * be set to an equivalent object by the caller.
 */

;(function() {

"use strict";
/*global module:false, chrome:false, Utils:false*/

var CommonLogic = {};


if (typeof(Utils) === 'undefined' && typeof(Components) !== 'undefined') {
  Components.utils.import('resource://markdown_here_common/utils.js');

  // C.u.import creates only one cached instance of a module, so we'll changing
  // global for everywhere. This is okay, as long as global always provides
  // XHR, setTimeout, etc.
  // We're using a closure because CommonLogic.global might not get set until later.
  Utils.global = function() {
    return CommonLogic.global;
  };
}


/*
 ******************************************************************************
 Forgot-to-render check
 ******************************************************************************
 */

/*
 * Gets the forgot-to-render prompt. This must be called from a privileged script.
 */
function getForgotToRenderPrompt(responseCallback) {
  // Get the content of notification element
  Utils.getLocalFile(
    Utils.getLocalURL('/common/forgot-to-render-prompt.html'),
    'text/html',
    function(html) {
      // Get the logo image data
      Utils.getLocalFileAsBase64(
        Utils.getLocalURL('/common/images/icon24.png'),
        function(logoBase64) {
          // Do some rough template replacement
          html = html.replace('{{logoBase64}}', logoBase64);

          return responseCallback(html);
        });
      });
}

//
// Begin content script code
//

var WATCHED_PROPERTY = 'markdownHereForgotToRenderWatched';
var MARKDOWN_DETECTED_PROPERTY = 'markdownHereForgotToRenderMarkdownDetected';

// This function encapsulates the logic required to prevent accidental sending
// of email that the user wrote in Markdown but forgot to render.
function forgotToRenderIntervalCheck(focusedElem, MarkdownHere, htmlToText) {
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
  if (focusedElem.ownerDocument.location.host.indexOf('mail.google.') < 0) {
    return;
  }

  // If focus isn't in the compose body, there's nothing to do
  if (!MarkdownHere.elementCanBeRendered(focusedElem)) {
    return;
  }

  // If we've already set up watchers for this compose element, skip it.
  if (typeof(focusedElem[WATCHED_PROPERTY]) === 'undefined') {
    setupForgotToRenderInterceptors(focusedElem);
    focusedElem[WATCHED_PROPERTY] = true;
  }

  focusedElem[MARKDOWN_DETECTED_PROPERTY] = probablyWritingMarkdown(focusedElem, htmlToText);
}


function findClosestSendButton(elem) {
  // This is clearly fragile and will inevitably bring us grief as Google
  // changes the Gmail layout, button labels, etc. But I don't know a better
  // way to do this.

  // Gmail has a very different structure in Firefox than in Chrome: it uses an
  // iframe with contenteditable body in the former and a simple contenteditable
  // div in the latter. That means that sometimes we'll be crossing iframe
  // boundaries and sometimes we won't.

  var sendButton = null;
  while (elem.parentElement) {
    sendButton = elem.parentElement.querySelector('[role="button"][tabindex="1"]');
    if (sendButton) {
      return sendButton;
    }

    elem = elem.parentElement;
  }

  // If this appears to be in an iframe, make a recursive call.
  if (elem.ownerDocument.defaultView.frameElement) {
    return findClosestSendButton(elem.ownerDocument.defaultView.frameElement);
  }

  return null;
}


// Sets up event listeners to capture attempts to send the email.
function setupForgotToRenderInterceptors(composeElem) {
  var sendButton = findClosestSendButton(composeElem);

  if (!sendButton) {
    Utils.consoleLog('Markdown Here was unable to find the Gmail "Send" button. Please let the developers know by creating an issue at: https://github.com/adam-p/markdown-here/issues')
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
        && composeElem[MARKDOWN_DETECTED_PROPERTY]) {

      // This is surely overkill, but stopPropagation() isn't enough to prevent
      // Firefox from scolling down a page when space is hit.
      event.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();

      Utils.makeRequestToPrivilegedScript(
        composeElem.ownerDocument,
        { action: 'get-forgot-to-render-prompt'},
        function(response) {
          showForgotToRenderPrompt(response.html, composeElem, sendButton);
        });
    }
  };

  var sendButtonClickListener = function(event) {
    if (event.target === sendButton
        && !event[Utils.MARKDOWN_HERE_EVENT]
        && composeElem[MARKDOWN_DETECTED_PROPERTY]) {
      event.stopPropagation();
      event.preventDefault();

      Utils.makeRequestToPrivilegedScript(
        composeElem.ownerDocument,
        { action: 'get-forgot-to-render-prompt'},
        function(response) {
          showForgotToRenderPrompt(response.html, composeElem, sendButton);
        });

      return false;
    }
  };

  var sendHotkeyKeydownListener = function(event) {
    // Windows and Linux use Ctrl+Enter and OSX uses ⌘+Enter, so we're going
    // to check for either.
    if (event.target === composeElem
        && (event.metaKey || event.ctrlKey) && event.keyCode === ENTER_KEYCODE
        && composeElem[MARKDOWN_DETECTED_PROPERTY]) {
      event.stopPropagation();
      event.preventDefault();

      Utils.makeRequestToPrivilegedScript(
        composeElem.ownerDocument,
        { action: 'get-forgot-to-render-prompt'},
        function(response) {
          showForgotToRenderPrompt(response.html, composeElem, sendButton);
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
function probablyWritingMarkdown(composeElem, htmlToText) {
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
  // I'm worried about incorrectly catching square brackets in rendered code
  // blocks, so we're only going to look for '](' and '][' (which still aren't
  // immune to the problem, but a little better). This means we won't match
  // reference links (where the text in the square brackes is used elsewhere for
  // for the link).
  var links = mdMaybe.match(/\]\(|\]\[/);

  return (bulletList || backticks || math || em_strong || links);
}


function showForgotToRenderPrompt(html, composeElem, mailSendButton) {
  if (mailSendButton.ownerDocument.querySelector('#markdown-here-forgot-to-render')) {
    return;
  }

  var elem = mailSendButton.ownerDocument.createElement('div');
  mailSendButton.ownerDocument.body.appendChild(elem);
  Utils.saferSetOuterHTML(elem, html);

  // Note that `elem` is no longer valid after we call Utils.saferSetOuterHTML on it.

  var setupForgotToRenderPromptHandlers = function() {
    // Set focus to our first button.
    Utils.setFocus(mailSendButton.ownerDocument.querySelector('#markdown-here-forgot-to-render-buttons button'));

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
          mailSendButton.ownerDocument.body.addEventListener('keydown', keyboardCaptureHandler, true);
        },
        remove: function() {
          mailSendButton.ownerDocument.body.removeEventListener('keydown', keyboardCaptureHandler, true);
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
        Utils.setFocus(composeElem);
      }
    };

    keyboardCapture.add();

    var closeLink = mailSendButton.ownerDocument.querySelector('#markdown-here-forgot-to-render-close');
    closeLink.addEventListener('click', function(event) {
      event.preventDefault();
      dismissPrompt(event.target.ownerDocument, true);
      return false;
    });

    var backButton = mailSendButton.ownerDocument.querySelector('#markdown-here-forgot-to-render-button-back');
    backButton.addEventListener('click', function(event) {
      event.preventDefault();
      dismissPrompt(event.target.ownerDocument, true);
      return false;
    });

    var sendButton = mailSendButton.ownerDocument.querySelector('#markdown-here-forgot-to-render-button-send');
    sendButton.addEventListener('click', function(event) {
      event.preventDefault();
      dismissPrompt(event.target.ownerDocument, false);
      Utils.fireMouseClick(mailSendButton);
      return false;
    });
  };

  // Setting up the event listeners after a timeout is a dirty hack to fix
  // the bad Firefox behaviour of the prompt being dismissed if the space key
  // was hit on the email compose send button -- the keydown event was carrying
  // through to our "Back" button.
  mailSendButton.ownerDocument.defaultView.setTimeout(setupForgotToRenderPromptHandlers, 100);
}

/*
 End forgot-to-render
 ******************************************************************************
 */


// Expose these functions
CommonLogic.getForgotToRenderPrompt = getForgotToRenderPrompt;
CommonLogic.forgotToRenderIntervalCheck = forgotToRenderIntervalCheck;

CommonLogic.__defineSetter__('global', function(val) { CommonLogic._global = val; });
CommonLogic.__defineGetter__('global', function() {
  if (typeof(CommonLogic._global) === 'function') {
    return CommonLogic._global.call();
  }
  return CommonLogic._global;
});
CommonLogic.global = this;


var EXPORTED_SYMBOLS = ['CommonLogic'];

if (typeof module !== 'undefined') {
  module.exports = CommonLogic;
} else {
  this.CommonLogic = CommonLogic;
  this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
