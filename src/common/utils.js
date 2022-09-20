/*
 * Copyright Adam Pritchard 2015
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Utilities and helpers that are needed in multiple places.
 *
 * This module assumes that a global `window` is available.
 */

;(function() {

"use strict";
/*global module:false, chrome:false, safari:false*/


function consoleLog(logString) {
  if (typeof(console) !== 'undefined') {
    console.log(logString);
  }
  else {
    var consoleService = Components.classes['@mozilla.org/consoleservice;1']
                                   .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(String(logString));
  }
}

// TODO: Try to use `insertAdjacentHTML` for the inner and outer HTML functions.
// https://developer.mozilla.org/en-US/docs/Web/API/Element.insertAdjacentHTML

// Assigning a string directly to `element.innerHTML` is potentially dangerous:
// e.g., the string can contain harmful script elements. (Additionally, Mozilla
// won't let us pass validation with `innerHTML` assignments in place.)
// This function provides a safer way to append a HTML string into an element.
function saferSetInnerHTML(parentElem, htmlString) {
  // Jump through some hoops to avoid using innerHTML...

  var range = parentElem.ownerDocument.createRange();
  range.selectNodeContents(parentElem);

  var docFrag = range.createContextualFragment(htmlString);
  docFrag = sanitizeDocumentFragment(docFrag);

  range.deleteContents();
  range.insertNode(docFrag);
  range.detach();
}


// Approximating equivalent to assigning to `outerHTML` -- completely replaces
// the target element with `htmlString`.
// Note that some caveats apply that also apply to `outerHTML`:
// - The element must be in the DOM. Otherwise an exception will be thrown.
// - The original element has been removed from the DOM, but continues to exist.
//   Any references to it (such as the one passed into this function) will be
//   references to the original.
function saferSetOuterHTML(elem, htmlString) {
  if (!isElementinDocument(elem)) {
    throw new Error('Element must be in document');
  }

  var range = elem.ownerDocument.createRange();
  range.selectNode(elem);

  var docFrag = range.createContextualFragment(htmlString);
  docFrag = sanitizeDocumentFragment(docFrag);

  range.deleteContents();
  range.insertNode(docFrag);
  range.detach();
}


// Removes potentially harmful elements and attributes from `docFrag`.
// Returns a santized copy.
function sanitizeDocumentFragment(docFrag) {
  var i;

  // Don't modify the original
  docFrag = docFrag.cloneNode(true);

  var scriptTagElems = docFrag.querySelectorAll('script');
  for (i = 0; i < scriptTagElems.length; i++) {
    scriptTagElems[i].parentNode.removeChild(scriptTagElems[i]);
  }

  function cleanAttributes(node) {
    var i;

    if (typeof(node.removeAttribute) === 'undefined') {
      // We can't operate on this node
      return;
    }

    // Remove event handler attributes
    for (i = node.attributes.length-1; i >= 0; i--) {
      if (node.attributes[i].name.match(/^on/)) {
        node.removeAttribute(node.attributes[i].name);
      }
    }
  }

  walkDOM(docFrag.firstChild, cleanAttributes);

  return docFrag;
}


// Walk the DOM, executing `func` on each element.
// From Crockford.
function walkDOM(node, func) {
  func(node);
  node = node.firstChild;
  while(node) {
    walkDOM(node, func);
    node = node.nextSibling;
  }
}


// Next three functions from: http://stackoverflow.com/a/1483487/729729
// Returns true if `node` is in `range`.
// NOTE: This function is broken in Postbox: https://github.com/adam-p/markdown-here/issues/179
function rangeIntersectsNode(range, node) {
  var nodeRange;

  // adam-p: I have found that Range.intersectsNode gives incorrect results in
  // Chrome (but not Firefox). So we're going to use the fail-back code always,
  // regardless of whether the current platform implements Range.intersectsNode.
  /*
  if (range.intersectsNode) {
    return range.intersectsNode(node);
  }
  else {
    ...
  */

  nodeRange = node.ownerDocument.createRange();
  try {
    nodeRange.selectNode(node);
  }
  catch (e) {
    nodeRange.selectNodeContents(node);
  }

  // Workaround for this old Mozilla bug, which is still present in Postbox:
  // https://bugzilla.mozilla.org/show_bug.cgi?id=665279
  var END_TO_START = node.ownerDocument.defaultView.Range.END_TO_START || window.Range.END_TO_START;
  var START_TO_END = node.ownerDocument.defaultView.Range.START_TO_END || window.Range.START_TO_END;

  return range.compareBoundaryPoints(
            END_TO_START,
            nodeRange) === -1 &&
         range.compareBoundaryPoints(
            START_TO_END,
            nodeRange) === 1;
}


// Returns array of elements in selection.
function getSelectedElementsInDocument(doc) {
  var range, sel, containerElement;
  sel = doc.getSelection();
  if (sel.rangeCount > 0) {
    range = sel.getRangeAt(0);
  }

  if (!range) {
    return [];
  }

  return getSelectedElementsInRange(range);
}


// Returns array of elements in range
function getSelectedElementsInRange(range) {
  var elems = [], treeWalker, containerElement;

  if (range) {
    containerElement = range.commonAncestorContainer;
    if (containerElement.nodeType != 1) {
      containerElement = containerElement.parentNode;
    }

    elems = [treeWalker.currentNode];

    walkDOM(
      containerElement,
        function(node) {
          if (rangeIntersectsNode(range, node)) {
            elems.push(node);
          }
      });

    /*? if(platform!=='firefox' && platform!=='thunderbird'){ */
    /*
    // This code is probably superior, but TreeWalker is not supported by Postbox.
    // If this ends up getting used, it should probably be moved into walkDOM
    // (or walkDOM should be removed).

    treeWalker = doc.createTreeWalker(
        containerElement,
        range.commonAncestorContainerownerDocument.defaultView.NodeFilter.SHOW_ELEMENT,
        function(node) { return rangeIntersectsNode(range, node) ? range.commonAncestorContainerownerDocument.defaultView.NodeFilter.FILTER_ACCEPT : range.commonAncestorContainerownerDocument.defaultView.NodeFilter.FILTER_REJECT; },
        false
    );

    elems = [treeWalker.currentNode];
    while (treeWalker.nextNode()) {
      elems.push(treeWalker.currentNode);
    }
    */
    /*? } */
  }

  return elems;
}


function isElementinDocument(element) {
  var doc = element.ownerDocument;
  while (!!(element = element.parentNode)) {
    if (element === doc) {
      return true;
    }
  }
  return false;
}


// From: http://stackoverflow.com/a/3819589/729729
// Postbox doesn't support `node.outerHTML`.
function outerHTML(node, doc) {
  // if IE, Chrome take the internal method otherwise build one
  return node.outerHTML || (
    function(n){
        var div = doc.createElement('div'), h;
        div.appendChild(n.cloneNode(true));
        h = div.innerHTML;
        div = null;
        return h;
    })(node);
}


// From: http://stackoverflow.com/a/5499821/729729
var charsToReplace = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
};

function replaceChar(char) {
  return charsToReplace[char] || char;
}

// An approximate equivalent to outerHTML for document fragments.
function getDocumentFragmentHTML(docFrag) {
  var html = '', i;
  for (i = 0; i < docFrag.childNodes.length; i++) {
    var node = docFrag.childNodes[i];
    if (node.nodeType === node.TEXT_NODE) {
      html += node.nodeValue.replace(/[&<>]/g, replaceChar);
    }
    else { // going to assume ELEMENT_NODE
      html += outerHTML(node, docFrag.ownerDocument);
    }
  }

  return html;
}


function isElementDescendant(parent, descendant) {
  var ancestor = descendant;
  while (!!(ancestor = ancestor.parentNode)) {
    if (ancestor === parent) {
      return true;
    }
  }

  return false;
}


// Take a URL that refers to a file in this extension and makes it absolute.
// Note that the URL *must not* be relative to the current path position (i.e.,
// no "./blah" or "../blah"). So `url` must start with `/`.
function getLocalURL(url) {
  if (url[0] !== '/') {
    throw 'relative url not allowed: ' + url;
  }

  if (url.indexOf('://') >= 0) {
    // already absolute
    return url;
  }

  // (This if-structure is ugly to work around the preprocessor logic.)
  var matched = false;
  /*? if (platform==='chrome' || platform==='firefox') { */
  if (typeof(chrome) !== 'undefined') {
    matched = true;
    return chrome.extension.getURL(url);
  }
  /*? } */
  /*? if (platform==='safari') { */
  if (!matched && typeof(safari) !== 'undefined') {
    matched = true;
    return safari.extension.baseURI + 'markdown-here/src' + url;
  }
  /*? } */
  /*? if(platform==='thunderbird'){ */
  if (!matched) {
    matched = true;
    // Mozilla platform.
    // HACK: The proper URL depends on values in `chrome.manifest`. But we "know"
    // that there are only a couple of locations we request from, so we're going
    // to branch depending on the presence of "common".

    var COMMON = '/common/';
    var CONTENT = '/firefox/chrome/';

    if (url.indexOf(COMMON) === 0) {
      return 'resource://markdown_here_common/' + url.slice(COMMON.length);
    }
    else if (url.indexOf(CONTENT) === 0) {
      return 'chrome://markdown_here/' + url.slice(CONTENT.length);
    }
  }
  /*? } */

  throw 'unknown url type: ' + url;
}


// Makes an asynchrous XHR request for a local file (basically a thin wrapper).
// `mimetype` is optional. `callback` will be called with the responseText as
// argument.
// If error occurs, `callback`'s second parameter will be an error.
function getLocalFile(url, mimetype, callback) {
  if (!callback) {
    // optional mimetype not provided
    callback = mimetype;
    mimetype = null;
  }

  var xhr = new window.XMLHttpRequest();
  if (mimetype) {
    xhr.overrideMimeType(mimetype);
  }
  xhr.open('GET', url);

  xhr.onload = function() {
    if (callback) {
     callback(this.responseText);
     callback = null;
    }
  };

  xhr.onerror = function(e) {
    if (callback) {
      callback(null, e);
      callback = null;
    }
  };

  try {
    // On some platforms, xhr.send throws an error if the url is not found.
    // On some platforms, it will call onerror and on some it won't.
    xhr.send();
  }
  catch(e) {
    if (callback) {
      callback(null, e);
      callback = null;
      return;
    }
  }
}


// Does async XHR request to get data at `url`, then passes it to `callback`
// Base64-encoded.
// Intended to be used get the logo image file in a form that can be put in a
// data-url image element.
// If error occurs, `callback`'s second parameter will be an error.
function getLocalFileAsBase64(url, callback) {
  var xhr = new window.XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function() {
    var uInt8Array = new Uint8Array(this.response);
    var base64Data = base64EncArr(uInt8Array);

    if (callback) {
      callback(base64Data);
      callback = null;
    }
  };

  xhr.onerror = function(e) {
    if (callback) {
      callback(null, e);
      callback = null;
    }
  };

  try {
    // On some platforms, xhr.send throws an error if the url is not found.
    // On some platforms, it will call onerror and on some it won't.
    xhr.send();
  }
  catch(e) {
    if (callback) {
      callback(null, e);
      callback = null;
      return;
    }
  }
}


// Events fired by Markdown Here will have this property set to true.
var MARKDOWN_HERE_EVENT = 'markdown-here-event';

// Fire a mouse event on the given element. (Note: not super robust.)
function fireMouseClick(elem) {
  var clickEvent = elem.ownerDocument.createEvent('MouseEvent');
  clickEvent.initMouseEvent(
    'click',
    true,                           // bubbles: We want the event to bubble.
    true,                           // cancelable
    elem.ownerDocument.defaultView, // view,
    1,                              // detail,
    0,                              // screenX
    0,                              // screenY
    0,                              // clientX
    0,                              // clientY
    false,                          // ctrlKey
    false,                          // altKey
    false,                          // shiftKey
    false,                          // metaKey
    0,                              // button
    null);                          // relatedTarget

  clickEvent[MARKDOWN_HERE_EVENT] = true;

  elem.dispatchEvent(clickEvent);
}


var PRIVILEGED_REQUEST_EVENT_NAME = 'markdown-here-request-event';

function makeRequestToPrivilegedScript(doc, requestObj, callback) {
  // (This if-structure is ugly to work around the preprocessor logic.)
  var matched = false;
  /*? if(platform==='chrome' || platform==='firefox'){ */
  if (typeof(chrome) !== 'undefined') {
    matched = true;
    // If `callback` is undefined and we pass it anyway, Chrome complains with this:
    // Uncaught Error: Invocation of form extension.sendMessage(object, undefined, null) doesn't match definition extension.sendMessage(optional string extensionId, any message, optional function responseCallback)
    if (callback) {
      chrome.runtime.sendMessage(requestObj, callback);
    }
    else {
      chrome.runtime.sendMessage(requestObj);
    }
  }
  /*? } */
  /*? if(platform==='safari'){ */
  if (!matched && typeof(safari) !== 'undefined') {
    matched = true;
    /*
    Unlike Chrome, Safari doesn't provide a way to pass a callback to a background-
    script request. Instead the background script sends a separate message to
    the content script. We'll keep a set of outstanding callbacks to process as
    the responses come in.
    */

    // If this is the first call, do some initialization.
    if (typeof(makeRequestToPrivilegedScript.requestCallbacks) === 'undefined') {
      makeRequestToPrivilegedScript.requestCallbacks = {};

      // Handle messages received from the background script.
      var backgroundMessageHandler = function(event) {
        // Note that this message handler will get triggered by any request sent
        // from the background script to the content script for a page, and
        // it'll get triggered once for each frame in the page. So we need to
        // make very sure that we should be acting on the message.
        if (event.name === 'request-response') {
          var responseObj = window.JSON.parse(event.message);

          if (responseObj.requestID &&
              makeRequestToPrivilegedScript.requestCallbacks[responseObj.requestID]) {
            // Call the stored callback.
            makeRequestToPrivilegedScript.requestCallbacks[responseObj.requestID](responseObj.response);
            // And remove the stored callback.
            delete makeRequestToPrivilegedScript.requestCallbacks[responseObj.requestID];
          }
        }
      };
      safari.self.addEventListener('message', backgroundMessageHandler, false);
    }

    // Store the callback for later use in the response handler.
    if (callback) {
      var reqID = Math.random();
      makeRequestToPrivilegedScript.requestCallbacks[reqID] = callback;
      requestObj.requestID = reqID;
    }

    safari.self.tab.dispatchMessage('request', window.JSON.stringify(requestObj));
  }
  /*? } */
  /*? if(platform==='thunderbird'){ */
  if (!matched) { // Mozilla/XUL
    matched = true;

    // See: https://developer.mozilla.org/en-US/docs/Code_snippets/Interaction_between_privileged_and_non-privileged_pages#Chromium-like_messaging.3A_json_request_with_json_callback

    // Make a unique event name to use. (Bad style to modify the input like this...)
    requestObj.responseEventName = 'markdown-here-response-event-' + Math.floor(Math.random()*1000000);

    var request = doc.createTextNode(JSON.stringify(requestObj));

    var responseHandler = function(event) {
      var response = null;

      // There may be no response data.
      if (request.nodeValue) {
        response = JSON.parse(request.nodeValue);
      }

      request.parentNode.removeChild(request);

      if (callback) {
        callback(response);
      }
    };

    request.addEventListener(requestObj.responseEventName, responseHandler, false);

    (doc.head || doc.body).appendChild(request);

    var event = doc.createEvent('HTMLEvents');
    event.initEvent(PRIVILEGED_REQUEST_EVENT_NAME, true, false);
    request.dispatchEvent(event);
  }
  /*? } */
}


// Gives focus to the element.
// Setting focus into elements inside iframes is not simple.
function setFocus(elem) {
  // We need to do some tail-recursion focus setting up through the iframes.
  if (elem.document) {
    // This is a window
    if (elem.frameElement) {
      // This is the window of an iframe. Set focus to the parent window.
      setFocus(elem.frameElement.ownerDocument.defaultView);
    }
  }
  else if (elem.ownerDocument.defaultView.frameElement) {
    // This element is in an iframe. Set focus to its owner window.
    setFocus(elem.ownerDocument.defaultView);
  }

  elem.focus();
}


// Gets the URL of the top window that elem belongs to.
// May recurse up through iframes.
function getTopURL(win, justHostname) {
  if (win.frameElement) {
    // This is the window of an iframe
    return getTopURL(win.frameElement.ownerDocument.defaultView);
  }

  var url;
  // We still want a useful value if we're in Thunderbird, etc.
  if (!win.location.href || win.location.href === 'about:blank') {
    url = win.navigator.userAgent.match(/Thunderbird|Postbox'/);
    if (url) {
      url = url[0];
    }
  }
  else if (justHostname) {
    url = win.location.hostname;
  }
  else {
    url = win.location.href;
  }

  return url;
}

// Regarding methods for `nextTick` and related:
// For ordinary browser use, setTimeout() is throttled to 1000ms for inactive
// tabs. This doesn't seem to affect extensions, except... Chrome Canary is
// currently doing this for the extension background scripts. This causes
// horribly slow rendering. For info see:
// https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout#Inactive_tabs
// As an alternative, we can use a local XHR request/response.

function asyncCallbackXHR(callback) {
  var xhr = new window.XMLHttpRequest();
  xhr.open('HEAD', getLocalURL('/common/CHANGES.md'));

  xhr.onload = callback;
  xhr.onerror = callback;

  try {
    // On some platforms, xhr.send throws an error if the url is not found.
    // On some platforms, it will call onerror and on some it won't.
    xhr.send();
  }
  catch(e) {
    asyncCallbackTimeout(callback);
  }
}

function asyncCallbackTimeout(callback) {
  setTimeout(callback, 0);
}

// We prefer to use the setTimeout approach.
var asyncCallback = asyncCallbackTimeout;

// Sets a short timeout and then calls callback
function nextTick(callback, context) {
  nextTickFn(callback, context)();
}

// `context` is optional. Will be `this` when `callback` is called.
function nextTickFn(callback, context) {
  var start = new Date();

  return function nextTickFnInner() {
    var args = arguments;
    var runner = function() {
      // Detect a whether the async callback was super slow
      var end = new Date() - start;
      if (end > 200) {
        // setTimeout is too slow -- switch to the XHR approach.
        asyncCallback = asyncCallbackXHR;
      }

      callback.apply(context, args);
    };

    asyncCallback(runner);
  };
}


/*? if(platform==='thunderbird'){ */

/**
 * Returns the stored preference string for the given key.
 * Must only be called from a privileged Mozilla script.
 * @param {nsIPrefBranch} prefsBranch
 * @param {string} key
 * @returns {?string} The preference value. May be null if the preference is not set
 * or is null.
 */
function getMozStringPref(prefsBranch, key) {
  try {
    if (Services.vc.compare(Services.appinfo.platformVersion, '58') < 0) {
      return prefsBranch.getComplexValue(
                          key,
                          Components.interfaces.nsISupportsString).data;
    }

    return prefsBranch.getStringPref(key, null);
  }
  catch(e) {
    // getComplexValue could have thrown an exception because it didn't find the key. As
    // with getStringPref, we will default to null.
    return null;
  }
}

/**
 * Get the stored preference object, JSON-parsed, for the given key.
 * Must only be called from a privileged Mozilla script.
 * @param {nsIPrefBranch} prefsBranch
 * @param {string} key
 * @returns {?(object|number|boolean|string)} The preference object (any valid JSON
 * type). May be null if the preference is not set or is null.
 */
function getMozJsonPref(prefsBranch, key) {
  try {
    return JSON.parse(getMozStringPref(prefsBranch, key));
  }
  catch(e) {
    return null;
  }
}

/**
 * Store the preference string for the given key.
 * Must only be called from a privileged Mozilla script.
 * @param {nsIPrefBranch} prefsBranch
 * @param {string} key
 * @param {string} value
 */
function setMozStringPref(prefsBranch, key, value) {
  var supportString = Components.classes['@mozilla.org/supports-string;1']
                        .createInstance(Components.interfaces.nsISupportsString);

  if (Services.vc.compare(Services.appinfo.platformVersion, '58') < 0) {
    supportString.data = value;
    prefsBranch.setComplexValue(
                  key,
                  Components.interfaces.nsISupportsString,
                  supportString);
  }
  else {
    prefsBranch.setStringPref(key, value);
  }
}

/**
 * Store the given object in preferences under the given key.
 * Must only be called from a privileged Mozilla script.
 * @param {nsIPrefBranch} prefsBranch
 * @param {string} key
 * @param {?(object|number|boolean|string)} value
 */
function setMozJsonPref(prefsBranch, key, value) {
  setMozStringPref(prefsBranch, key, JSON.stringify(value));
}

/*? } */


/*
 * i18n/l10n
 */
/*
This is a much bigger hassle than it should be. i18n support is great on Chrome
(and Opera, and Firefox+WebExtensions), a bit of a hassle on Thunderbird/XUL,
and basically nonexistent on Safari.

In Chrome, we can use `chrome.i18n.getMessage` to just get the string we want,
in either content or background scripts, synchronously and with no extra prep
work.

In Thunderbird, we need to load the `strings.properties` string bundle for both the
current locale and English (our fallback language) and combine them. This can
only be done from a privileged script. Then we can use the strings. The loading
is synchronous for the privileged script, but asynchronous for the unprivileged
script (because it needs to make a request to the privileged script).

In Safari, we need to read in the JSON files for the current locale and English
(our fallback language) and combine them. This can only be done from a privileged
script. Then we can use the strings. The loading is asynchronous for both
privileged and unprivileged scripts (because async XHR is used for the former
and a request is made to the privileged script for the latter).

It can happen that attempts to access the strings are made before the loading
has actually occurred. This has been observed on Safari in the MDH Options page.
This necessitated the addition of `registerStringBundleLoadListener` and
`triggerStringBundleLoadListeners`, which may be used to ensure that `getMessage`
calls wait until the loading is complete.
*/

var g_stringBundleLoadListeners = [];

function registerStringBundleLoadListener(callback) {
  // (This if-structure is ugly to work around the preprocessor logic.)
  var matched = false;
  /*? if(platform==='chrome' || platform==='firefox'){ */
  if (typeof(chrome) !== 'undefined') {
    matched = true;
    // Already loaded
    Utils.nextTick(callback);
    return;
  }
  /*? } */
  /*? if(platform==='safari'){ */
  if (!matched
      && typeof(g_safariStringBundle) === 'object'
      && Object.keys(g_safariStringBundle).length > 0) {
    matched = true;
    // Already loaded
    Utils.nextTick(callback);
    return;
  }
  /*? } */
  /*? if(platform==='thunderbird'){ */
  if (!matched
      && typeof(g_mozStringBundle) === 'object'
      && Object.keys(g_mozStringBundle).length > 0) {
    matched = true;
    // Already loaded
    Utils.nextTick(callback);
    return;
  }
  /*? } */

  g_stringBundleLoadListeners.push(callback);
}

function triggerStringBundleLoadListeners() {
  var listener;
  while (g_stringBundleLoadListeners.length > 0) {
    listener = g_stringBundleLoadListeners.pop();
    listener();
  }
}


// Must only be called from a privileged Mozilla script
function getMozStringBundle() {
  if (typeof(Components) === 'undefined' || typeof(Components.classes) === 'undefined') {
    return false;
  }

  // Return a cached bundle, if we have one
  if (typeof(g_mozStringBundle) !== 'undefined' &&
      Object.keys(g_mozStringBundle).length > 0) {
    return g_mozStringBundle;
  }

  // Adapted from: https://developer.mozilla.org/en-US/docs/Code_snippets/Miscellaneous#Using_string_bundles_from_JavaScript
  // and: https://developer.mozilla.org/en-US/docs/Using_nsISimpleEnumerator

  var stringBundleObj = {}, stringBundle, stringBundleEnum, property;

  // First load the English fallback strings

  stringBundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                        .getService(Components.interfaces.nsIStringBundleService)
                        // Notice the explicit locale in this path:
                        .createBundle("resource://markdown_here_locale/en/strings.properties");

  stringBundleEnum = stringBundle.getSimpleEnumeration();
  while (stringBundleEnum.hasMoreElements()) {
    property = stringBundleEnum.getNext().QueryInterface(Components.interfaces.nsIPropertyElement);
    stringBundleObj[property.key] = property.value;
  }

  // Then load the strings that are overridden for the current locale

  stringBundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                        .getService(Components.interfaces.nsIStringBundleService)
                        .createBundle("chrome://markdown_here/locale/strings.properties");

  stringBundleEnum = stringBundle.getSimpleEnumeration();
  while (stringBundleEnum.hasMoreElements()) {
    property = stringBundleEnum.getNext().QueryInterface(Components.interfaces.nsIPropertyElement);
    stringBundleObj[property.key] = property.value;
  }

  return stringBundleObj;
}

/*? if(platform==='thunderbird'){ */
// Load the Mozilla string bundle
if (typeof(chrome) === 'undefined' && typeof(safari) === 'undefined') {
  var g_mozStringBundle = getMozStringBundle();

  if (!g_mozStringBundle || Object.keys(g_mozStringBundle).length === 0) {
    window.setTimeout(function requestMozStringBundle() {
      makeRequestToPrivilegedScript(window.document, {action: 'get-string-bundle'}, function(response) {
        g_mozStringBundle = response;
        triggerStringBundleLoadListeners();
      });
    }, 0);
  }
  else {
    // g_mozStringBundle is filled in
    triggerStringBundleLoadListeners();
  }
}
/*? } */


/*? if(platform==='safari'){ */
// Will only succeed when called from a privileged Safari script.
// `callback(data, err)` is passed a non-null value for err in case of total
// failure, which should be interpreted as being called from a non-privileged
// (content) script.
// Otherwise `data` will contain the string bundle object.
function getSafariStringBundle(callback) {

  // Can't use Utils.functionname in this function, since the exports haven't
  // been set up at the time it's called.

  var stringBundle = {};

  // Return a cached bundle, if we have one
  if (typeof(g_safariStringBundle) !== 'undefined' &&
      Object.keys(g_safariStringBundle).length > 0) {
    nextTickFn(callback)(g_safariStringBundle);
    return;
  }

  // Get the English fallback
  getStringBundle('en', function(data, err) {
    if (err) {
      consoleLog('Error getting English string bundle:');
      consoleLog(err);
      return callback(null, err);
    }

    extendBundle(stringBundle, data);

    var locale = window.navigator.language;
    if (locale.indexOf('en') === 0) {
      // The locale is English, nothing more to do
      return callback(stringBundle, null);
    }

    // Get the actual locale string bundle
    getStringBundle(locale, function(data, err) {
      if (err) {
        // The locale in navigator.language typically looks like "ja-JP", but
        // MDH's locale typically looks like "ja".
        locale = locale.split('-')[0];
        getStringBundle(locale, function(data, err) {
          if (err) {
            // Couldn't find it. We'll just have to use the fallback.
            consoleLog('Markdown Here has no language support for: ' + locale);
            return callback(stringBundle);
          }

          extendBundle(stringBundle, data);
          return callback(stringBundle);
        });
      }

      extendBundle(stringBundle, data);
      return callback(stringBundle);
    });
  });


  function getStringBundle(locale, callback) {
    var url = getLocalURL('/_locales/' + locale + '/messages.json');
    getLocalFile(url, 'application/json', function(data, err) {
      if (err) {
        return callback(null, err);
      }

      // Chrome's messages.json uses "$" as placeholders and "$$" as an explicit
      // "$". We're not yet using placeholders, so we'll just convert double to singles.
      data = data.replace(/\$\$/g, '$');

      return callback(JSON.parse(data));
    });
  }

  function extendBundle(intoBundle, fromObj) {
    var key;
    for (key in fromObj) {
      intoBundle[key] = fromObj[key].message;
    }
  }
}
/*? } */

/*? if(platform==='safari'){ */
// Load the Safari string bundle
if (typeof(safari) !== 'undefined') {
  var g_safariStringBundle = {};
  // This is effectively checking if we're calling from a privileged script.
  // We could instead just try getSafariStringBundle() and check the error, but
  // that's surely less efficient.
  if (typeof(safari.application) !== 'undefined') {
    // calling from a privileged script
    getSafariStringBundle(function(data, err) {
      if (err) {
        consoleLog('Markdown Here: privileged script failed to load string bundle: ' + err);
        return;
      }
      g_safariStringBundle = data;
      triggerStringBundleLoadListeners();
    });
  }
  else {
    // Call from the privileged script
    makeRequestToPrivilegedScript(window.document, {action: 'get-string-bundle'}, function(response) {
      if (response) {
        g_safariStringBundle = response;
        triggerStringBundleLoadListeners();
      }
      else {
        consoleLog('Markdown Here: content script failed to get string bundle from privileged script');
      }
    });
  }
}
/*? } */


// Get the translated string indicated by `messageID`.
// Note that there's no support for placeholders as yet.
// Throws exception if message is not found or if the platform doesn't support
// internationalization (yet).
function getMessage(messageID) {
  var message = '';

  // (This if-structure is ugly to work around the preprocessor logic.)
  var matched = false;
  /*? if (platform==='chrome' || platform==='firefox') { */
  if (typeof(chrome) !== 'undefined') {
    matched = true;
    message = chrome.i18n.getMessage(messageID);
  }
  /*? } */
  /*? if (platform==='safari') { */
  if (!matched && typeof(safari) !== 'undefined') {
    matched = true;
    if (g_safariStringBundle) {
      message = g_safariStringBundle[messageID];
    }
    else {
      // We don't yet have the string bundle available
      return '';
    }
  }
  /*? } */
  /*? if (platform==='thunderbird') { */
  if (!matched) { // Mozilla
    matched = true;
    if (g_mozStringBundle) {
      message = g_mozStringBundle[messageID];
    }
    else {
      // We don't yet have the string bundle available
      return '';
    }
  }
  /*? } */

  if (!message) {
    throw new Error('Could not find message ID: ' + messageID);
  }

  return message;
}


/*****************************************************************************/
/*\
|*|
|*|  Base64 / binary data / UTF-8 strings utilities
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
|*|
\*/

/* Array of bytes to base64 string decoding */

function b64ToUint6 (nChr) {

  return nChr > 64 && nChr < 91 ?
      nChr - 65
    : nChr > 96 && nChr < 123 ?
      nChr - 71
    : nChr > 47 && nChr < 58 ?
      nChr + 4
    : nChr === 43 ?
      62
    : nChr === 47 ?
      63
    :
      0;

}

function base64DecToArr (sBase64, nBlocksSize) {

  var
    sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;

    }
  }

  return taBytes;
}

/* Base64 string to array encoding */

function uint6ToB64 (nUint6) {

  return nUint6 < 26 ?
      nUint6 + 65
    : nUint6 < 52 ?
      nUint6 + 71
    : nUint6 < 62 ?
      nUint6 - 4
    : nUint6 === 62 ?
      43
    : nUint6 === 63 ?
      47
    :
      65;

}

function base64EncArr (aBytes) {

  var nMod3 = 2, sB64Enc = "";

  for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
    nMod3 = nIdx % 3;
    if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
    nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
    if (nMod3 === 2 || aBytes.length - nIdx === 1) {
      sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
      nUint24 = 0;
    }
  }

  return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');

}

/* UTF-8 array to DOMString and vice versa */

function utf8ArrToStr (aBytes) {

  var sView = "";

  for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
    nPart = aBytes[nIdx];
    sView += String.fromCharCode(
      nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
        /* (nPart - 252 << 32) is not possible in ECMAScript! So...: */
        (nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
        (nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
        (nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
        (nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
        (nPart - 192 << 6) + aBytes[++nIdx] - 128
      : /* nPart < 127 ? */ /* one byte */
        nPart
    );
  }

  return sView;

}

function strToUTF8Arr (sDOMStr) {

  var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;

  /* mapping... */

  for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
    nChr = sDOMStr.charCodeAt(nMapIdx);
    nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
  }

  aBytes = new Uint8Array(nArrLen);

  /* transcription... */

  for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
    nChr = sDOMStr.charCodeAt(nChrIdx);
    if (nChr < 128) {
      /* one byte */
      aBytes[nIdx++] = nChr;
    } else if (nChr < 0x800) {
      /* two bytes */
      aBytes[nIdx++] = 192 + (nChr >>> 6);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x10000) {
      /* three bytes */
      aBytes[nIdx++] = 224 + (nChr >>> 12);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x200000) {
      /* four bytes */
      aBytes[nIdx++] = 240 + (nChr >>> 18);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x4000000) {
      /* five bytes */
      aBytes[nIdx++] = 248 + (nChr >>> 24);
      aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else /* if (nChr <= 0x7fffffff) */ {
      /* six bytes */
      aBytes[nIdx++] = 252 + /* (nChr >>> 32) is not possible in ECMAScript! So...: */ (nChr / 1073741824);
      aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    }
  }

  return aBytes;

}
/*****************************************************************************/
function utf8StringToBase64(str) {
  return base64EncArr(strToUTF8Arr(str));
}
function base64ToUTF8String(str) {
  return utf8ArrToStr(base64DecToArr(str));
}


// Expose these functions

var Utils = {};

Utils.saferSetInnerHTML = saferSetInnerHTML;
Utils.saferSetOuterHTML = saferSetOuterHTML;
Utils.walkDOM = walkDOM;
Utils.sanitizeDocumentFragment = sanitizeDocumentFragment;
Utils.rangeIntersectsNode = rangeIntersectsNode;
Utils.getDocumentFragmentHTML = getDocumentFragmentHTML;
Utils.isElementDescendant = isElementDescendant;
Utils.getLocalURL = getLocalURL;
Utils.getLocalFile = getLocalFile;
Utils.getLocalFileAsBase64 = getLocalFileAsBase64;
Utils.fireMouseClick = fireMouseClick;
Utils.MARKDOWN_HERE_EVENT = MARKDOWN_HERE_EVENT;
Utils.makeRequestToPrivilegedScript = makeRequestToPrivilegedScript;
Utils.PRIVILEGED_REQUEST_EVENT_NAME = PRIVILEGED_REQUEST_EVENT_NAME;
Utils.consoleLog = consoleLog;
Utils.setFocus = setFocus;
Utils.getTopURL = getTopURL;
Utils.nextTick = nextTick;
Utils.nextTickFn = nextTickFn;
/*? if(platform==='thunderbird'){ */
Utils.getMozStringPref = getMozStringPref;
Utils.getMozJsonPref = getMozJsonPref;
Utils.setMozStringPref = setMozStringPref;
Utils.setMozJsonPref = setMozJsonPref;
Utils.getMozStringBundle = getMozStringBundle;
/*? } */
/*? if(platform==='safari'){ */
Utils.getSafariStringBundle = getSafariStringBundle;
/*? } */
Utils.registerStringBundleLoadListener = registerStringBundleLoadListener;
Utils.getMessage = getMessage;
Utils.utf8StringToBase64 = utf8StringToBase64;
Utils.base64ToUTF8String = base64ToUTF8String;


var EXPORTED_SYMBOLS = ['Utils'];

if (typeof module !== 'undefined') {
  module.exports = Utils;
} else {
  this.Utils = Utils;
  this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
