/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Chrome-specific code for responding to the context menu item and providing
 * rendering services.
 */

// Handle the menu-item click
function clickRequest(event) {
  var focusedElem, mdReturn;

  if (event && event.action === 'context-click') {

    // Check if the focused element is a valid render target
    focusedElem = markdownHere.findFocusedElem(window.document);
    if (!markdownHere.elementCanBeRendered(focusedElem)) {
      alert('The selected field is not valid for Markdown rendering. Please use a rich editor.');
      return;
    }

    function logger() { console.log.apply(console, arguments); }

    mdReturn = markdownHere(document, requestMarkdownConversion, logger);

    if (typeof(mdReturn) === 'string') {
      // Error message was returned.
      alert(mdReturn);
      return;
    }
  }
}
chrome.extension.onRequest.addListener(clickRequest);

// The rendering service provided to the content script.
// See the comment in markdown-render.js for why we do this.
function requestMarkdownConversion(html, callback) {
  // Send a request to the add-on script to actually do the rendering.
  chrome.extension.sendRequest(html, function(response) {
    callback(response.html, response.css);
  });
}

