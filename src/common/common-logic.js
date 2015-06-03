/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Application logic that is common to all (or some) platforms.
 * (And isn't generic enough for utils.js or render-y enough for markdown-render.js,
 * etc.)
 *
 * This module assumes that a global `window` is available.
 */

;(function() {

"use strict";
/*global module:false, chrome:false, Utils:false*/


var DEBUG = false;
function debugLog() {
  var i, log = '';
  if (!DEBUG) {
    return;
  }
  for (i = 0; i < arguments.length; i++) {
    log += String(arguments[i]) + ' // ';
  }
  Utils.consoleLog(log);
}


/*
 * Gets the upgrade notification. This must be called from a privileged script.
 */
function getUpgradeNotification(optionsURL, responseCallback) {
  debugLog('getUpgradeNotification', 'getting');

  Utils.getLocalFile(
    Utils.getLocalURL('/common/upgrade-notification.html'),
    'text/html',
    function(html) {
      // Get the logo image data
      Utils.getLocalFileAsBase64(
        Utils.getLocalURL('/common/images/icon32.png'),
        function(logoBase64) {
          // Do some rough template replacement
          html = html.replace('{{optionsURL}}', optionsURL)
                     .replace('{{logoBase64}}', logoBase64)
                     .replace('{{upgrade_notification_changes_tooltip}}', Utils.getMessage('upgrade_notification_changes_tooltip'))
                     .replace('{{upgrade_notification_text}}', Utils.getMessage('upgrade_notification_text'))
                     .replace('{{upgrade_notification_dismiss_tooltip}}', Utils.getMessage('upgrade_notification_dismiss_tooltip'));

          debugLog('getUpgradeNotification', 'got');
          return responseCallback(html);
        });
      });
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
  debugLog('getForgotToRenderPromptContent', 'getting');

  Utils.getLocalFile(
    Utils.getLocalURL('/common/forgot-to-render-prompt.html'),
    'text/html',
    function(html) {
      html = html.replace('{{forgot_to_render_prompt_title}}', Utils.getMessage('forgot_to_render_prompt_title'))
                 .replace('{{forgot_to_render_prompt_info}}', Utils.getMessage('forgot_to_render_prompt_info'))
                 .replace('{{forgot_to_render_prompt_question}}', Utils.getMessage('forgot_to_render_prompt_question'))
                 .replace('{{forgot_to_render_prompt_close_hover}}', Utils.getMessage('forgot_to_render_prompt_close_hover'))
                 .replace('{{forgot_to_render_back_button}}', Utils.getMessage('forgot_to_render_back_button'))
                 .replace('{{forgot_to_render_send_button}}', Utils.getMessage('forgot_to_render_send_button'));

      // Get the logo image data
      Utils.getLocalFileAsBase64(
        Utils.getLocalURL('/common/images/icon48.png'),
        function(logoBase64) {
          // Do some rough template replacement
          html = html.replace('{{logoBase64}}', logoBase64);

          debugLog('getForgotToRenderPromptContent', 'got');
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

// Returns the correct selector to use when looking for the Send button.
// Returns null if forgot-to-render should not be used here.
function getForgotToRenderButtonSelector(elem) {
  if (elem.ownerDocument.location.host.indexOf('mail.google.') >= 0) {
    return '[role="button"][tabindex="1"]';
  }
  else if (elem.ownerDocument.location.host.indexOf('inbox.google.') >= 0) {
    return '[role="button"][tabindex="0"][jsaction$=".send"]';
  }

  return null;
}


// This function encapsulates the logic required to prevent accidental sending
// of email that the user wrote in Markdown but forgot to render.
function forgotToRenderIntervalCheck(focusedElem, MarkdownHere, MdhHtmlToText, marked, prefs) {
  if (!prefs['forgot-to-render-check-enabled']) {
    debugLog('forgotToRenderIntervalCheck', 'pref disabled');
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

  var forgotToRenderButtonSelector = getForgotToRenderButtonSelector(focusedElem);
  if (!forgotToRenderButtonSelector) {
    debugLog('forgotToRenderIntervalCheck', 'not supported');
    return;
  }

  // If focus isn't in the compose body, there's nothing to do
  if (!MarkdownHere.elementCanBeRendered(focusedElem)) {
    debugLog('forgotToRenderIntervalCheck', 'cannot be rendered');
    return;
  }

  // If we've already set up watchers for this compose element, skip it.
  if (typeof(focusedElem[WATCHED_PROPERTY]) === 'undefined') {
    debugLog('forgotToRenderIntervalCheck', 'setting up interceptors');
    setupForgotToRenderInterceptors(focusedElem, MdhHtmlToText, marked, prefs);
    focusedElem[WATCHED_PROPERTY] = true;
  }
  else {
    debugLog('forgotToRenderIntervalCheck', 'interceptors already in place');
  }
}


function findClosestSendButton(elem) {
  // This is clearly fragile and will inevitably bring us grief as Google
  // changes the Gmail layout, button labels, etc. But I don't know a better
  // way to do this.

  // Gmail has a very different structure in Firefox than in Chrome: it uses an
  // iframe with contenteditable body in the former and a simple contenteditable
  // div in the latter. That means that sometimes we'll be crossing iframe
  // boundaries and sometimes we won't.

  var forgotToRenderButtonSelector = getForgotToRenderButtonSelector(elem);
  // If we're in this function, this should be non-null, but...
  if (!forgotToRenderButtonSelector) {
    return null;
  }

  var sendButton = null;
  while (elem.parentNode && elem.parentNode.nodeType === elem.ELEMENT_NODE) {
    sendButton = elem.parentNode.querySelector(forgotToRenderButtonSelector);
    if (sendButton) {
      debugLog('findClosestSendButton', 'found');
      return sendButton;
    }

    elem = elem.parentNode;
  }

  // If this appears to be in an iframe, make a recursive call.
  if (elem.ownerDocument.defaultView.frameElement) {
    return findClosestSendButton(elem.ownerDocument.defaultView.frameElement);
  }

  debugLog('findClosestSendButton', 'not found');
  return null;
}


// Totally shuts down propagation of event, if we didn't trigger the event.
function eatEvent(event) {
  if (event[Utils.MARKDOWN_HERE_EVENT]) {
    debugLog('eatEvent', 'MDH event eaten', event.type);
    return;
  }

  event.stopImmediatePropagation();
  event.stopPropagation();
  event.preventDefault();
  debugLog('eatEvent', 'non-MDH event eaten', event.type);
}


// Sets up event listeners to capture attempts to send the email.
function setupForgotToRenderInterceptors(composeElem, MdhHtmlToText, marked, prefs) {
  var composeSendButton = findClosestSendButton(composeElem);

  if (!composeSendButton) {
    Utils.consoleLog('Markdown Here was unable to find the Gmail "Send" button. Please let the developers know by creating an issue at: https://github.com/adam-p/markdown-here/issues');
    return;
  }

  var shouldIntercept = function() {
    var mdMaybe = new MdhHtmlToText.MdhHtmlToText(composeElem, null, true).get();
    return probablyWritingMarkdown(mdMaybe, marked, prefs);
  };

  // Helper function to look for element within parents up to a certain point.
  // We use this because sometimes a click even happens on a child element of
  // the send button, but we still want it to count as a click on the button.
  var isSendButtonOrChild = function(eventTarget) {
    var elem = eventTarget;
    while (elem && elem.nodeType === elem.ELEMENT_NODE &&
           elem !== composeSendButton.parentNode) {
      if (elem === composeSendButton) {
        return true;
      }
      elem = elem.parentNode;
    }
    return false;
  };

  // NOTE: We are setting the event listeners on the *parent* element of the
  // send button and compose area. This is so that we can capture and prevent
  // propagation to the actual element, thereby preventing Gmail's event
  // listeners from firing.

  var composeSendButtonKeyListener = function(event) {
    if (isSendButtonOrChild(event.target) &&
        (event.keyCode === ENTER_KEYCODE || event.keyCode === SPACE_KEYCODE) &&
        shouldIntercept()) {
      // Gmail uses keydown to trigger its send action. Firefox fires keyup even if
      // keydown has been suppressed or hasn't yet been let through.
      // So we're going to suppress keydown and act on keyup.

      if (event.type === 'keydown') {
        eatEvent(event);
      }
      else if (event.type === 'keyup') {
        eatEvent(event);
        showForgotToRenderPromptAndRespond(composeElem, composeSendButton);
      }
    }
  };

  var composeSendButtonClickListener = function(event) {
    if (isSendButtonOrChild(event.target) &&
        !event[Utils.MARKDOWN_HERE_EVENT] &&
        shouldIntercept()) {
      eatEvent(event);
      showForgotToRenderPromptAndRespond(composeElem, composeSendButton);
    }
  };

  var sendHotkeyKeydownListener = function(event) {
    // Windows and Linux use Ctrl+Enter and OSX uses ⌘+Enter, so we're going
    // to check for either.

    // There is a bug in Firefox (that has bitten us before) that causes tabbing
    // into a `contenteditable` element to give focus to the parent `HTMLHtmlElement`
    // rather than the edit element. If we don't work around this, then our hotkey
    // interceptor won't work if the user tabs from the subject into the body
    // (which lots of users do).
    // https://bugzilla.mozilla.org/show_bug.cgi?id=740813
    var ourTarget =
      (event.target === composeElem) ||
      (event.target instanceof composeElem.ownerDocument.defaultView.HTMLHtmlElement &&
       event.target === composeElem.parentNode);

    if (ourTarget &&
        (event.metaKey || event.ctrlKey) && event.keyCode === ENTER_KEYCODE &&
        shouldIntercept()) {
      eatEvent(event);
      debugLog('setupForgotToRenderInterceptors', 'sendHotkeyKeydownListener', 'capture desired event');
      showForgotToRenderPromptAndRespond(composeElem, composeSendButton);
    }
    debugLog('setupForgotToRenderInterceptors', 'sendHotkeyKeydownListener', 'skipping undesired event', event.target);
  };

  composeSendButton.parentNode.addEventListener('keydown', composeSendButtonKeyListener, true);
  composeSendButton.parentNode.addEventListener('keyup', composeSendButtonKeyListener, true);
  composeSendButton.parentNode.addEventListener('click', composeSendButtonClickListener, true);
  composeElem.parentNode.addEventListener('keydown', sendHotkeyKeydownListener, true);
}

// Returns true if `text` looks like raw Markdown, false otherwise.
function probablyWritingMarkdown(mdMaybe, marked, prefs) {
  /*
  This is going to be tricksy and fraught with danger. Challenges:
    * If it's not sensitive enough, it's useless.
    * If it's too sensitive, users will be super annoyed.
    * Different people write different kinds of Markdown: coders use backticks,
      mathies use dollar signs, normal people don't use either.
    * Being slow would be bad.

  Ways I considered doing this, but discarded:
    * Use Highlight.js's relevance score.
    * Use the size of the array returned by Marked.js's lexer/parser.
    * Render the contents, replace `<p>` tags with newlines, do string distance.

  But I think there are some simple heuristics that will probably be more
  accurate and/or faster.
  */

  // Ensure that we're not checking on enormous amounts of text.
  if (mdMaybe.length > 10000) {
    mdMaybe = mdMaybe.slice(0, 10000);
  }

  // TODO: Export regexes from Marked.js instead of copying them. Except...
  // Marked's rules use /^.../, which breaks our matching.

  // NOTE: It's going to be tempting to use a ton of fancy regexes, but remember
  // that this check is getting run every few seconds, and we don't want to
  // slow down the user's browser.
  // To that end, we're going to stop checking when we find a match.

  function logMatch(type, match) {
    var log =
      'Markdown Here detected unrendered ' + type +
      (typeof(match.index) !== 'undefined' ?
        (': "' + mdMaybe.slice(match.index, match.index+10) + '"') :
        '');

    if (log !== probablyWritingMarkdown.lastLog) {
      Utils.consoleLog(log);
      probablyWritingMarkdown.lastLog = log;
    }
  }

  // At least two bullet points
  var bulletList = mdMaybe.match(/^[*+-] /mg);
  if (bulletList && bulletList.length > 1) {
    logMatch('bullet list', bulletList);
    return true;
  }

  // Backticks == code. Does anyone use backticks for anything else?
  var backticks = mdMaybe.match(/`/);
  if (backticks) {
    logMatch('code', backticks);
    return true;
  }

  // Math
  var math = mdMaybe.match(/\$([^ \t\n\$]([^\$]*[^ \t\n\$])?)\$/);
  if (math) {
    logMatch('math', math);
    return true;
  }

  // We're going to look for strong emphasis (e.g., double asterisk), but not
  // light emphasis (e.g., single asterisk). Rationale: people use surrounding
  // single asterisks pretty often in ordinary, non-MD text, and we don't want
  // to be annoying.
  // TODO: If we ever get really fancy with MD detection, the presence of light
  // emphasis should still contribute towards the determination.
  var emphasis = mdMaybe.match(/__([\s\S]+?)__(?!_)|\*\*([\s\S]+?)\*\*(?!\*)/);
  if (emphasis) {
    logMatch('emphasis', emphasis);
    return true;
  }

  // Headers. (But not hash-mark-H1, since that seems more likely to false-positive, and
  // less likely to be used. And underlines of at least length 5.)
  var header = mdMaybe.match(/(^\s{0,3}#{2,6}[^#])|(^\s*[-=]{5,}\s*$)/m);
  if (header) {
    logMatch('header', header);
    return true;
  }

  // Links
  // I'm worried about incorrectly catching square brackets in rendered code
  // blocks, so we're only going to look for '](' and '][' (which still aren't
  // immune to the problem, but a little better). This means we won't match
  // reference links (where the text in the square brackes is used elsewhere for
  // for the link).
  var link = mdMaybe.match(/\]\(|\]\[/);
  if (link) {
    logMatch('link', link);
    return true;
  }

  return false;
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
        promptInfo: Utils.getMessage('forgot_to_render_prompt_info'),
        promptQuestion: Utils.getMessage('forgot_to_render_prompt_question'),
        promptBackButton: Utils.getMessage('forgot_to_render_back_button'),
        promptSendButton: Utils.getMessage('forgot_to_render_send_button') },
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
var CommonLogic = {};
CommonLogic.getUpgradeNotification = getUpgradeNotification;
CommonLogic.getForgotToRenderPromptContent = getForgotToRenderPromptContent;
CommonLogic.forgotToRenderIntervalCheck = forgotToRenderIntervalCheck;
CommonLogic.probablyWritingMarkdown = probablyWritingMarkdown;


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
