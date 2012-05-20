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
  if (event && event.action === 'context-click') {
    markdownHere(document, requestMarkdownConversion);
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

