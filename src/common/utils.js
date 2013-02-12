/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * Utilitiles and helpers that are needed in multiple places.
 */

;(function() {

"use strict";
/*global module:false*/


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
};


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
    return;
  }

  var range = elem.ownerDocument.createRange();
  range.selectNode(elem);

  var docFrag = range.createContextualFragment(htmlString);
  docFrag = sanitizeDocumentFragment(docFrag);

  range.deleteContents();
  range.insertNode(docFrag);
  range.detach();
};


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
// From Crockform.
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
  while (element = element.parentNode) {
    if (element === doc) {
      return true;
    }
  }
  return false;
}


// Expose these functions
var Utils = {};
Utils.saferSetInnerHTML = saferSetInnerHTML;
Utils.saferSetOuterHTML = saferSetOuterHTML;
Utils.sanitizeDocumentFragment = sanitizeDocumentFragment;

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
