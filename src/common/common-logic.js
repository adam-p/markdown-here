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

  // C.u.import creates only one cached instance of a module, so Utils.global
  // might already be set elsewhere.
  if (!Utils.global) {
    // We're using a closure because CommonLogic.global might not get set until later.
    Utils.global = function() {
      return CommonLogic.global;
    };
  }
}


/*
 ******************************************************************************
 Forgot-to-render check
 ******************************************************************************
 */

/*
 * Gets the forgot-to-render prompt. This must be called from a privileged script.
 */
function getForgotToRenderPromptContent(responseCallback) {
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

/* Regarding Firefox and the spacebar.

In Chrome, canceling the spacebar `keydown` event seems to successfully prevent
the resulting `click` event on a button. This is what we'd like to have happen.

In Firefox, canceling the spacebar `keydown` does *not* prevent the `click` event.
This has two annoying effects for us:

1. If the user hits `space` on the Gmail Send button and they don't release right
away, our message box's focused button might get immediately `click`ed.

2. If the user hits `space` to dismiss our message box, any button underneath
(such as on Gmail's "Please specificy at least one recipient" box) might get
clicked.
*/

// TODO: Can we use VK_* instead?
var ENTER_KEYCODE = 13;
var SPACE_KEYCODE = 32;
var TAB_KEYCODE = 9;
var ESCAPE_KEYCODE = 27;

var WATCHED_PROPERTY = 'markdownHereForgotToRenderWatched';
var MARKDOWN_DETECTED_PROPERTY = 'markdownHereForgotToRenderMarkdownDetected';

var FORGOT_TO_RENDER_PROMPT_INFO = "It looks like you wrote this email in Markdown but forgot to make it pretty.";
var FORGOT_TO_RENDER_PROMPT_QUESTION = "Send it anyway?";

// This function encapsulates the logic required to prevent accidental sending
// of email that the user wrote in Markdown but forgot to render.
function forgotToRenderIntervalCheck(focusedElem, MarkdownHere, htmlToText, prefs) {
  if (!prefs['forgot-to-render-check-enabled']) {
    return;
  }

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


// Totally shuts down propagation of event, if we didn't trigger the event.
function eatEvent(event) {
  if (event[Utils.MARKDOWN_HERE_EVENT]) {
    return;
  }

  event.stopImmediatePropagation();
  event.stopPropagation();
  event.preventDefault();
}


// Sets up event listeners to capture attempts to send the email.
function setupForgotToRenderInterceptors(composeElem) {
  var composeSendButton = findClosestSendButton(composeElem);

  if (!composeSendButton) {
    Utils.consoleLog('Markdown Here was unable to find the Gmail "Send" button. Please let the developers know by creating an issue at: https://github.com/adam-p/markdown-here/issues');
    return;
  }

  // NOTE: We are setting the event listeners on the *parent* element of the
  // send button and compose area. This is so that we can capture and prevent
  // propagation to the actual element, thereby preventing Gmail's event
  // listeners from firing.

  var composeSendButtonKeydownListener = function(event) {
    if (event.target === composeSendButton &&
        (event.keyCode === ENTER_KEYCODE || event.keyCode === SPACE_KEYCODE) &&
        composeElem[MARKDOWN_DETECTED_PROPERTY]) {
      eatEvent(event);
      showForgotToRenderPromptAndRespond(composeElem, composeSendButton);
    }
  };

  var composeSendButtonClickListener = function(event) {
    if (event.target === composeSendButton &&
        !event[Utils.MARKDOWN_HERE_EVENT] &&
        composeElem[MARKDOWN_DETECTED_PROPERTY]) {
      eatEvent(event);
      showForgotToRenderPromptAndRespond(composeElem, composeSendButton);
    }
  };

  var sendHotkeyKeydownListener = function(event) {
    // Windows and Linux use Ctrl+Enter and OSX uses ⌘+Enter, so we're going
    // to check for either.
    if (event.target === composeElem &&
        (event.metaKey || event.ctrlKey) && event.keyCode === ENTER_KEYCODE &&
        composeElem[MARKDOWN_DETECTED_PROPERTY]) {
      eatEvent(event);
      showForgotToRenderPromptAndRespond(composeElem, composeSendButton);
    }
  };

  // Gmail uses keydown to trigger its send action. Firefox fires keyup even if
  // keydown has been suppressed or hasn't yet been let through.
  // So we're going to completely supporess keydown and act on keyup.
  composeSendButton.parentElement.addEventListener('keyup', composeSendButtonKeydownListener, true);
  composeSendButton.parentElement.addEventListener('keydown', eatEvent, true);

  composeSendButton.parentElement.addEventListener('click', composeSendButtonClickListener, true);
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


function showForgotToRenderPromptAndRespond(composeElem, composeSendButton) {
  var sendOrGoBackToCompose = function(send) {
    if (send) {
      Utils.fireMouseClick(composeSendButton);
    }
    else {
      Utils.setFocus(composeElem);
    }
  };

  // Decide which prompt style to use.
  if (typeof(composeElem.ownerDocument.defaultView.openDialog) !== 'undefined') {
    var promptParams = {
      inn:{
        promptInfo: FORGOT_TO_RENDER_PROMPT_INFO,
        promptQuestion: FORGOT_TO_RENDER_PROMPT_QUESTION},
      out:null
    };
    composeElem.ownerDocument.defaultView.openDialog(
      "chrome://markdown_here/content/confirm-prompt.xul",
      "",
      "chrome, dialog, modal, centerscreen",
      promptParams).focus();

    sendOrGoBackToCompose(promptParams.out);
  }
  else {
    Utils.makeRequestToPrivilegedScript(
      composeElem.ownerDocument,
      { action: 'get-forgot-to-render-prompt'},
      function(response) {
        showHTMLForgotToRenderPrompt(
          response.html,
          composeElem,
          composeSendButton,
          sendOrGoBackToCompose);
      });
  }
}


// Shows prompt and then calls `callback` passing true if the email sending
// should be halted.
function showHTMLForgotToRenderPrompt(html, composeElem, composeSendButton, callback) {
  var elem, keyboardCapture, dismissPrompt, closeLink, backButton, sendButton,
    okayToKeyupTimeout, okayToKeyup;

  elem = composeSendButton.ownerDocument.createElement('div');
  composeSendButton.ownerDocument.body.appendChild(elem);
  Utils.saferSetOuterHTML(elem, html);

  // Note that `elem` is no longer valid after we call Utils.saferSetOuterHTML on it.

  // Set focus to our first button.
  Utils.setFocus(composeSendButton.ownerDocument.querySelector('#markdown-here-forgot-to-render-buttons button'));

  // We're going to prevent `keyup` firing for a short amount of time to help
  // deal with late `keyup` events resulting from initial Gmail Send activation.
  okayToKeyup = false;
  okayToKeyupTimeout = function() {
    okayToKeyup = true;
  };
  composeSendButton.ownerDocument.defaultView.setTimeout(okayToKeyupTimeout, 300);

  // Also add an Escape key handler and other keyboard shortcut disabler.
  // Without this, Gmail shortcuts will fire if our buttons don't have focus.
  // NOTE: If we don't properly remove this in every case that the prompt is
  // dismissed, then we'll break the user's ability to type anything.
  keyboardCapture = (function() {
    var keyboardCaptureHandler = function(event) {
      eatEvent(event);

      if (event.keyCode === ESCAPE_KEYCODE) {
        // We don't check okayToKeyup here, since Escape couldn't have been been
        // the key that launched the prompt.
        dismissPrompt(event.target.ownerDocument, false);
      }
      else if (event.keyCode === TAB_KEYCODE) {
        if (!okayToKeyup) {
          return;
        }

        if (event.target.ownerDocument.activeElement === backButton) {
          sendButton.focus();
        }
        else {
          backButton.focus();
        }
      }
      else if (event.keyCode === ENTER_KEYCODE || event.keyCode === SPACE_KEYCODE) {
        if (!okayToKeyup) {
          return;
        }

        if (event.ctrlKey || event.metaKey) {
          // This is probably a late keyup resulting from the Gmail send hotkey
          // (Ctrl+Enter/Cmd+Enter), so ignore it.
          return;
        }

        if (event.target.ownerDocument.activeElement === backButton ||
            event.target.ownerDocument.activeElement === sendButton)
        {
          Utils.fireMouseClick(event.target.ownerDocument.activeElement);
        }
      }
    };

    return {
      add: function() {
        // We need to respond to the `keyup` event so that it doesn't fire after
        // we dismiss our prompt (affecting some control in Gmail).
        // We need to swallow `keydown` events so that they don't trigger
        // keyboard shortcuts in Gmail.
        composeSendButton.ownerDocument.body.addEventListener('keydown', eatEvent, true);
        composeSendButton.ownerDocument.body.addEventListener('keyup', keyboardCaptureHandler, true);
      },
      remove: function() {
        composeSendButton.ownerDocument.body.removeEventListener('keydown', eatEvent, true);
        composeSendButton.ownerDocument.body.removeEventListener('keyup', keyboardCaptureHandler, true);
      }
    };
  })();

  dismissPrompt = function(doc, send) {
    keyboardCapture.remove();

    var forgotToRenderContent = doc.querySelector('#markdown-here-forgot-to-render');
    if (forgotToRenderContent) {
      doc.body.removeChild(forgotToRenderContent);
    }

    callback(send);
  };

  keyboardCapture.add();

  closeLink = composeSendButton.ownerDocument.querySelector('#markdown-here-forgot-to-render-close');
  closeLink.addEventListener('click', function(event) {
    eatEvent(event);
    dismissPrompt(event.target.ownerDocument, false);
  });

  backButton = composeSendButton.ownerDocument.querySelector('#markdown-here-forgot-to-render-button-back');
  backButton.addEventListener('click', function(event) {
    eatEvent(event);
    dismissPrompt(event.target.ownerDocument, false);
  });

  sendButton = composeSendButton.ownerDocument.querySelector('#markdown-here-forgot-to-render-button-send');
  sendButton.addEventListener('click', function(event) {
    eatEvent(event);
    dismissPrompt(event.target.ownerDocument, true);
  });
}

/*
 End forgot-to-render
 ******************************************************************************
 */


// Expose these functions
CommonLogic.getForgotToRenderPromptContent = getForgotToRenderPromptContent;
CommonLogic.forgotToRenderIntervalCheck = forgotToRenderIntervalCheck;
CommonLogic.probablyWritingMarkdown = probablyWritingMarkdown;
CommonLogic.FORGOT_TO_RENDER_PROMPT_INFO = FORGOT_TO_RENDER_PROMPT_INFO;
CommonLogic.FORGOT_TO_RENDER_PROMPT_QUESTION = FORGOT_TO_RENDER_PROMPT_QUESTION;

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
