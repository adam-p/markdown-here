/*
 * Copyright Adam Pritchard 2013
 * MIT License : https://adampritchard.mit-license.org/
 */

"use strict";
/*global chrome:false, markdownHere:false, CommonLogic:false, htmlToText:false,
    Utils:false, MdhHtmlToText:false, marked:false*/
/*jshint devel:true, browser:true*/


/*
 * Chrome-specific code for responding to the context menu item and providing
 * rendering services.
 *
 * This version removes automatic injection and focus detection.
 * Scripts are now injected on-demand when the user activates the extension.
 */


// Handle the menu-item click
function requestHandler(request, sender, sendResponse) {
  if (request && request.action === 'button-click') {

    // Check if the focused element is a valid render target
    const focusedElem = markdownHere.findFocusedElem(window.document);
    if (!focusedElem) {
      // Shouldn't happen. But if it does, just silently abort.
      return false;
    }

    if (!markdownHere.elementCanBeRendered(focusedElem)) {
      alert(Utils.getMessage('invalid_field'));
      return false;
    }

    const logger = function() { console.log.apply(console, arguments); };

    const mdReturn = markdownHere(
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
}
chrome.runtime.onMessage.addListener(requestHandler);


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


// When rendering (or unrendering) completed
function markdownRenderComplete(elem, rendered) {
  // No-op for now
}


/*
 * Forgot-to-render check
 * Sets up hooks on send buttons to check for unrendered Markdown
 */

let forgotToRenderIntervalCheckPrefs = null;

// Get the options for the forgot-to-render check
Utils.makeRequestToPrivilegedScript(
  document,
  { action: 'get-options' },
  function(prefs) {
    forgotToRenderIntervalCheckPrefs = prefs;
  });

// Check periodically if we should set up forgot-to-render hooks
function forgotToRenderCheck() {
  if (!forgotToRenderIntervalCheckPrefs ||
      !forgotToRenderIntervalCheckPrefs['forgot-to-render-check-enabled-2']) {
    return;
  }

  let focusedElem = markdownHere.findFocusedElem(window.document);
  if (!focusedElem) {
    return;
  }

  CommonLogic.forgotToRenderIntervalCheck(
    focusedElem,
    markdownHere,
    MdhHtmlToText,
    marked,
    forgotToRenderIntervalCheckPrefs);
}

// Run the check every 2 seconds to catch dynamically loaded elements
setInterval(forgotToRenderCheck, 2000);
