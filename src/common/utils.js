;(function() {

"use strict";
/*global module:false*/

var Utils = {};

function saferSetInnerHTML(parentElem, htmlString) {
  // Jump through some hoops to avoid using innerHTML...

  var range = parentElem.ownerDocument.createRange();
  range.selectNodeContents(parentElem);

  var docFrag = range.createContextualFragment(htmlString);
  sanitizeDocumentFragment(docFrag);

  range.deleteContents();
  range.insertNode(docFrag);
  range.detach();
};

function sanitizeDocumentFragment(docFrag) {
  var i;
  var scriptTagElems = docFrag.querySelectorAll('script');
  for (i = 0; i < scriptTagElems.length; i++) {
    scriptTagElems[i].parentElement.removeChild(scriptTagElems[i]);
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
}

function walkDOM(node, func) {
  func(node);
  node = node.firstChild;
  while(node) {
    walkDOM(node, func);
    node = node.nextSibling;
  }
}

// Expose these functions
Utils.saferSetInnerHTML = saferSetInnerHTML;
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
