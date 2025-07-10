/*
 * Copyright Adam Pritchard 2015
 * MIT License : https://adampritchard.mit-license.org/
 */

/*
 * Utilities and helpers that are needed in multiple places.
 *
 * This module assumes that a global `window` is available.
 */

;(function() {

"use strict";
/*global module:false, chrome:false*/

function consoleLog(logString) {
  if (typeof(console) !== 'undefined') {
    console.log(logString);
  }
}

// TODO: Try to use `insertAdjacentHTML` for the inner and outer HTML functions.
// https://developer.mozilla.org/en-US/docs/Web/API/Element.insertAdjacentHTML

/**
 * Safely parse an HTML string into a DocumentFragment without executing scripts.
 * Uses DOMPurify to sanitize and parse HTML into a DocumentFragment.
 *
 * @param {string} htmlString - The HTML string to parse and sanitize.
 * @param {Document} [ownerDocument] - The document to use for creating the fragment. Defaults to the global document.
 * @param {boolean} [allowStyleTags] - Whether to allow <style> tags in the sanitized output.
 * @returns {DocumentFragment} The sanitized DocumentFragment.
 */
function safelyParseHTML(htmlString, ownerDocument, allowStyleTags=false) {
  ownerDocument = ownerDocument || document;

  // DOMPurify is required for security
  if (typeof DOMPurify === 'undefined') {
    throw new Error('DOMPurify is required but not loaded. Cannot safely parse HTML.');
  }

  const domPurifyConfig = {
    RETURN_DOM_FRAGMENT: true, // Return a DocumentFragment instead of a string
    DOCUMENT: ownerDocument, // Specify which document to use for creating the fragment
  };
  if (allowStyleTags) {
    domPurifyConfig.ADD_TAGS = ['style']; // Allow <style> tags
    domPurifyConfig.FORCE_BODY = true; // Ensure <style> tags are processed correctly
  }

  // Sanitize and parse HTML into a DocumentFragment
  const docFrag = DOMPurify.sanitize(htmlString, domPurifyConfig);

  return docFrag;
}

// Assigning a string directly to `element.innerHTML` is potentially dangerous:
// e.g., the string can contain harmful script elements. (Additionally, Mozilla
// won't let us pass validation with `innerHTML` assignments in place.)
// This function provides a safer way to append a HTML string into an element.
function saferSetInnerHTML(parentElem, htmlString, allowStyleTags=false) {
  const docFrag = safelyParseHTML(htmlString, parentElem.ownerDocument, allowStyleTags);

  const range = parentElem.ownerDocument.createRange();
  range.selectNodeContents(parentElem);
  range.deleteContents();
  range.insertNode(docFrag);
  range.detach();
}


// Approximately equivalent to assigning to `outerHTML` -- completely replaces
// the target element with `htmlString`.
// Note that some caveats apply that also apply to `outerHTML`:
// - The element must be in the DOM. Otherwise an exception will be thrown.
// - The original element has been removed from the DOM, but continues to exist.
//   Any references to it (such as the one passed into this function) will be
//   references to the original.
function saferSetOuterHTML(elem, htmlString, allowStyleTags=false) {
  if (!isElementInDocument(elem)) {
    throw new Error('Element must be in document');
  }

  const docFrag = safelyParseHTML(htmlString, elem.ownerDocument, allowStyleTags);

  const range = elem.ownerDocument.createRange();
  range.selectNode(elem);
  range.deleteContents();
  range.insertNode(docFrag);
  range.detach();
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


// Next three functions from: https://stackoverflow.com/a/1483487/729729
// Returns true if `node` is in `range`.
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

  // TODO: Remove this workaround, as we no longer support Postbox or XUL Mozilla.
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

    /*? if(platform!=='firefox'){ */
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


function isElementInDocument(element) {
  var doc = element.ownerDocument;
  while (!!(element = element.parentNode)) {
    if (element === doc) {
      return true;
    }
  }
  return false;
}


// From: https://stackoverflow.com/a/3819589/729729
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


// From: https://stackoverflow.com/a/5499821/729729
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

  return chrome.runtime.getURL(url);
}


// Makes an asynchronous XHR request for a local file (basically a thin wrapper).
// `dataType` must be one of 'text', 'json', or 'base64'.
// `callback` will be called with the response value, of a type depending on `dataType`.
// Errors are not expected for local files, and will result in an exception being thrown asynchronously.
// TODO: Return a promise instead of using a callback. This will allow returning an error
// properly, and then this can be used in options.js when checking for the existence of
// the test file.
function getLocalFile(url, dataType, callback) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }

      switch (dataType) {
        case 'text':
          return response.text();
        case 'json':
          return response.json();
        case 'base64':
          return response.blob();
        default:
          throw new Error(`Unknown dataType: ${dataType}`);
      }
    })
    .then(data => {
      switch (dataType) {
        case 'text':
        case 'json':
          callback(data);
          break;
        case 'base64':
          data.arrayBuffer().then(function(buffer) {
            var uInt8Array = new Uint8Array(buffer);
            var base64Data = base64EncArr(uInt8Array);
            callback(base64Data);
          });
      }
    })
    .catch(err => {
        throw new Error(`Error fetching local file: ${url}: ${err}`);
    });
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
  // If `callback` is undefined and we pass it anyway, Chrome complains with this:
  // Uncaught Error: Invocation of form extension.sendMessage(object, undefined, null) doesn't match definition extension.sendMessage(optional string extensionId, any message, optional function responseCallback)
  if (callback) {
    chrome.runtime.sendMessage(requestObj, callback);
  }
  else {
    chrome.runtime.sendMessage(requestObj);
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
    url = win.navigator.userAgent.match(/Thunderbird'/);
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
// This function just does a simple, local async request and then calls the callback.
function asyncCallbackXHR(callback) {
  fetch(getLocalURL('/common/CHANGES.md'), {method: 'HEAD'})
    .then(callback)
    .catch(callback);
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

// Returns true if the semver version string in a is greater than the one in b.
// If a or b isn't a version string, a simple string comparison is returned.
// If a or b is falsy, false is returned.
// From https://stackoverflow.com/a/55466325
function semverGreaterThan(a, b) {
  if (!a || !b) {
    return false;
  }
  return a.localeCompare(b, undefined, { numeric: true }) === 1;
}


/*
 * i18n/l10n
 */
// Get the translated string indicated by `messageID`.
// Note that there's no support for placeholders as yet.
// Throws exception if message is not found.
function getMessage(messageID) {
  var message = chrome.i18n.getMessage(messageID);

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
Utils.safelyParseHTML = safelyParseHTML;
Utils.walkDOM = walkDOM;
Utils.rangeIntersectsNode = rangeIntersectsNode;
Utils.getDocumentFragmentHTML = getDocumentFragmentHTML;
Utils.isElementDescendant = isElementDescendant;
Utils.getLocalURL = getLocalURL;
Utils.getLocalFile = getLocalFile;
Utils.fireMouseClick = fireMouseClick;
Utils.MARKDOWN_HERE_EVENT = MARKDOWN_HERE_EVENT;
Utils.makeRequestToPrivilegedScript = makeRequestToPrivilegedScript;
Utils.PRIVILEGED_REQUEST_EVENT_NAME = PRIVILEGED_REQUEST_EVENT_NAME;
Utils.consoleLog = consoleLog;
Utils.setFocus = setFocus;
Utils.getTopURL = getTopURL;
Utils.nextTick = nextTick;
Utils.nextTickFn = nextTickFn;
Utils.getMessage = getMessage;
Utils.semverGreaterThan = semverGreaterThan;
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
