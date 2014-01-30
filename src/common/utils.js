/*
 * Copyright Adam Pritchard 2014
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Utilities and helpers that are needed in multiple places.
 * If this module is being instantiated without a global `window` object being
 * available (providing XMLHttpRequest, for example), then `Utils.global` must
 * be set to an equivalent object by the caller.
 */

;(function() {

"use strict";
/*global module:false, chrome:false, safari:false*/


var Utils = {};

// For some reason the other two ways of creating properties don't work.
Utils.__defineSetter__('global', function(val) { Utils._global = val; });
Utils.__defineGetter__('global', function() {
  if (typeof(Utils._global) === 'function') {
    return Utils._global.call();
  }
  return Utils._global;
});
Utils.global = this;


function consoleLog(logString) {
  if (typeof(console) !== 'undefined') {
    console.log(logString);
  }
  else {
    var consoleService = Components.classes['@mozilla.org/consoleservice;1']
                                   .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(logString);
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

  if (typeof(chrome) !== 'undefined') {
    return chrome.extension.getURL(url);
  }
  else if (typeof(safari) !== 'undefined') {
    return safari.extension.baseURI + 'markdown-here/src' + url;
  }
  else {
    // Mozilla platform.
    // HACK The proper URL depends on values in `chrome.manifest`. But we "know"
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

  var xhr = new Utils.global.XMLHttpRequest();
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
  var xhr = new Utils.global.XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function() {
    var uInt8Array = new Uint8Array(this.response);
    var i = uInt8Array.length;
    var binaryString = new Array(i);
    while (i--)
    {
      binaryString[i] = String.fromCharCode(uInt8Array[i]);
    }
    var data = binaryString.join('');

    var base64Data = Utils.global.btoa(data);

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
    false,                          // bubbles: We want to target this element and do not want the event to bubble.
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
  if (typeof(chrome) !== 'undefined') {
    // If `callback` is undefined and we pass it anyway, Chrome complains with this:
    // Uncaught Error: Invocation of form extension.sendMessage(object, undefined, null) doesn't match definition extension.sendMessage(optional string extensionId, any message, optional function responseCallback)
    if (callback) {
      chrome.extension.sendMessage(requestObj, callback);
    }
    else {
      chrome.extension.sendMessage(requestObj);
    }
  }
  else if (typeof(safari) !== 'undefined') {
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
          var responseObj = Utils.global.JSON.parse(event.message);

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

    safari.self.tab.dispatchMessage('request', Utils.global.JSON.stringify(requestObj));
  }
  else {
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


// Sets a short timeout and then calls callback
function nextTick(callback, context) {
  var runner = function nextTickInner() {
    callback.call(context);
  };

  Utils.global.setTimeout(runner, 0);
}

// `context` is optional. Will be `this` when `callback` is called.
function nextTickFn(callback, context) {
  return function nextTickFnInner() {
    var args = arguments;
    var runner = function() {
      callback.apply(context, args);
    };

    Utils.global.setTimeout(runner, 0);
  };
}


/*
 * i18n/l10n
 */
/*
This is a much bigger hassle than it should be. i18n support is great on Chrome,
a bit of a hassle on Firefox/Thunderbird, and basically nonexistent on Safari.

In Chrome, we can use `chrome.i18n.getMessage` to just get the string we want,
in either content or background scripts, synchronously and with no extra prep
work.

In Firefox, we need to load the `strings.properties` string bundle for both the
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
  if (typeof(chrome) !== 'undefined' ||
      (typeof(g_mozStringBundle) === 'object' && Object.keys(g_mozStringBundle).length > 0) ||
      (typeof(g_safariStringBundle) === 'object' && Object.keys(g_safariStringBundle).length > 0)) {
    // Already loaded
    Utils.nextTick(callback);
    return;
  }

  g_stringBundleLoadListeners.push(callback);
}

function triggerStringBundleLoadListeners() {
  var listener;
  while (g_stringBundleLoadListeners.length > 0) {
    listener = g_stringBundleLoadListeners.pop();
    listener();
  }
}


// Must only be called from a priviledged Mozilla script
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

  stringBundle = Utils.global.Components.classes["@mozilla.org/intl/stringbundle;1"]
                        .getService(Components.interfaces.nsIStringBundleService)
                        // Notice the explicit locale in this path:
                        .createBundle("resource://markdown_here_locale/en/strings.properties");

  stringBundleEnum = stringBundle.getSimpleEnumeration();
  while (stringBundleEnum.hasMoreElements()) {
    property = stringBundleEnum.getNext().QueryInterface(Components.interfaces.nsIPropertyElement);
    stringBundleObj[property.key] = property.value;
  }

  // Then load the strings that are overridden for the current locale

  stringBundle = Utils.global.Components.classes["@mozilla.org/intl/stringbundle;1"]
                        .getService(Components.interfaces.nsIStringBundleService)
                        .createBundle("chrome://markdown_here/locale/strings.properties");

  stringBundleEnum = stringBundle.getSimpleEnumeration();
  while (stringBundleEnum.hasMoreElements()) {
    property = stringBundleEnum.getNext().QueryInterface(Components.interfaces.nsIPropertyElement);
    stringBundleObj[property.key] = property.value;
  }

  return stringBundleObj;
}

// Load the Mozilla string bundle
if (typeof(chrome) === 'undefined' && typeof(safari) === 'undefined') {
  var g_mozStringBundle = getMozStringBundle();

  if ((!g_mozStringBundle || Object.keys(g_mozStringBundle).length === 0) &&
      Utils.global.setTimeout) {
    Utils.global.setTimeout(function requestMozStringBundle() {
      makeRequestToPrivilegedScript(Utils.global.document, {action: 'get-string-bundle'}, function(response) {
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

    var locale = Utils.global.navigator.language;
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
    makeRequestToPrivilegedScript(Utils.global.document, {action: 'get-string-bundle'}, function(response) {
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


// Get the translated string indicated by `messageID`.
// Note that there's no support for placeholders as yet.
// Throws exception if message is not found or if the platform doesn't support
// internationalization (yet).
function getMessage(messageID) {
  var message = '';
  if (typeof(chrome) !== 'undefined') {
    message = chrome.i18n.getMessage(messageID);
  }
  else if (typeof(safari) !== 'undefined') {
    if (g_safariStringBundle) {
      message = g_safariStringBundle[messageID];
    }
    else {
      // We don't yet have the string bundle available
      return '';
    }
  }
  else { // Mozilla
    if (g_mozStringBundle) {
      message = g_mozStringBundle[messageID];
    }
    else {
      // We don't yet have the string bundle available
      return '';
    }
  }

  if (!message) {
    throw new Error('Could not find message ID: ' + messageID);
  }

  return message;
}


// Expose these functions

Utils.saferSetInnerHTML = saferSetInnerHTML;
Utils.saferSetOuterHTML = saferSetOuterHTML;
Utils.sanitizeDocumentFragment = sanitizeDocumentFragment;
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
Utils.getMozStringBundle = getMozStringBundle;
Utils.getSafariStringBundle = getSafariStringBundle;
Utils.registerStringBundleLoadListener = registerStringBundleLoadListener;
Utils.getMessage = getMessage;


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
