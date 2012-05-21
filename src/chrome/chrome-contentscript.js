/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Chrome-specific code for responding to the context menu item and providing
 * rendering services.
 */

function menuItemShouldShowNow(targetDocument) {
  var showItem = false, focusedElem = null;

  function testElem(elem) {
    // See here for more info about what we're checking:
    // http://stackoverflow.com/a/3333679/729729
    return elem.contentEditable === true || elem.contentEditable === 'true'
           || elem.contenteditable === true || elem.contenteditable === 'true'
           || (elem.ownerDocument && elem.ownerDocument.designMode === 'on');
  }

  // If the focus is within an iframe, we'll have to drill down to get to the
  // actual element.
  focusedElem = targetDocument.activeElement;
  while (focusedElem && focusedElem.contentDocument) {
    focusedElem = focusedElem.contentDocument.activeElement;
  }

  // Test all the way up to the parent <body> (needed for Hotmail on Firefox).
  while (focusedElem) {
    showItem = testElem(focusedElem);
    if (showItem) break;
    focusedElem = focusedElem.parentElement;
  }

  return showItem;
}

function addMousedownListenerToAllDocuments(startDoc) {
  var iframes, i;
  iframes = startDoc.querySelectorAll('iframe');
  for (i = 0; i < iframes.length; i++) {
    // An exception may result from try to access cross-domain iframes.
    try {
      addMousedownListenerToAllDocuments(iframes[i].contentDocument);
    }
    catch(e) {} // just carry on
  }

  startDoc.addEventListener('mousedown', function(event) {
    if (menuItemShouldShowNow(event.target.ownerDocument)) {
      chrome.extension.sendRequest({action: 'create-menu'});
    }
    else {
      chrome.extension.sendRequest({action: 'delete-menu'});
    }
  }, true);
}
addMousedownListenerToAllDocuments(document);


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
  chrome.extension.sendRequest(
    { action: 'render-markdown', html: html },
    function(response) {
      callback(response.html, response.css);
    });
}

