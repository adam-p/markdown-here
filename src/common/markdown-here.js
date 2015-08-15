/*
 * Copyright Adam Pritchard 2015
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * This file is the heart of Markdown Here. It decides whether we're rendering
 * or reverting; whether we're doing a selection or the whole thing; and
 * actually does it (calling out for the final render).
 */

/*
Regarding our rendered Markdown "wrappers": When we render a some Markdown
-- whether it's the entire content or sub-selection -- we need to save the
original Markdown (actually, Markdown-in-HTML) somewhere so that we can later
unrender if the user requests it. Where to save the original markdown is a
difficult decision, since many web interface will disallow or strip certain
attributes or attribute values (etc.).

We have found that the `title` attribute of a `<div>` element is preserved. (In
the sites tested at the time of writing.) So we're create an empty `<div>`, and
store the original MD in the `title` attribute, prefixed with a marker (`MDH:`)
to help prevent false positives when looking for wrappers.

Then, looking for "wrappers" will involve looking for the "div with original MD
in title" and then getting its parent.

(The reason that we're not storing the MD in the title of the wrapper itself is
that that will result in the raw MD being shown as a tooltip when the user
hovers over the wrapper. The extra empty div won't have any size, so there
won't be a hover problem.)

For info about the ideas we had and experiments we ran, see:
https://github.com/adam-p/markdown-here/issues/85
*/


;(function() {

"use strict";
/*global module:false*/


var WRAPPER_TITLE_PREFIX = 'MDH:';


// In Firefox/Thunderbird, Utils won't already exist.
if (typeof(Utils) === 'undefined' &&
    typeof(safari) === 'undefined' && typeof(chrome) === 'undefined') {
  var scriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                               .getService(Components.interfaces.mozIJSSubScriptLoader);
  scriptLoader.loadSubScript('resource://markdown_here_common/utils.js');
}

// For debugging purposes. An external service is required to log with Firefox.
var mylog = function() {};

// Finds and returns the page element that currently has focus. Drills down into
// iframes if necessary.
function findFocusedElem(document) {
  var focusedElem = document.activeElement;

  // Fix #173: https://github.com/adam-p/markdown-here/issues/173
  // If the focus is in an iframe with a different origin, then attempting to
  // access focusedElem.contentDocument will fail with a `SecurityError`:
  // "Failed to read the 'contentDocument' property from 'HTMLIFrameElement': Blocked a frame with origin "http://jsbin.io" from accessing a cross-origin frame."
  // Rather than spam the console with exceptions, we'll treat this as an
  // unrenderable situation (which it is).
  try {
    var accessTest = focusedElem.contentDocument;
  }
  catch (e) {
    // TODO: Check that this is actually a SecurityError and re-throw if it's not?
    return null;
  }

  // If the focus is within an iframe, we'll have to drill down to get to the
  // actual element.
  while (focusedElem && focusedElem.contentDocument) {
    focusedElem = focusedElem.contentDocument.activeElement;
  }

  // There's a bug in Firefox/Thunderbird that we need to work around. For
  // details see https://github.com/adam-p/markdown-here/issues/31
  // The short version: Sometimes we'll get the <html> element instead of <body>.
  if (focusedElem instanceof document.defaultView.HTMLHtmlElement) {
    focusedElem = focusedElem.ownerDocument.body;
  }

  return focusedElem;
}

// Returns true if the given element can be properly rendered (i.e., if it's
// a rich-edit compose element).
function elementCanBeRendered(elem) {
  // See here for more info about what we're checking:
  // http://stackoverflow.com/a/3333679/729729
  return (elem.contentEditable === true || elem.contentEditable === 'true' ||
          elem.contenteditable === true || elem.contenteditable === 'true' ||
          (elem.ownerDocument && elem.ownerDocument.designMode === 'on'));
}

// Get the currectly selected range. If there is no selected range (i.e., it is
// collapsed), then contents of the currently focused element will be selected.
// Returns null if no range is selected nor can be selected.
function getOperationalRange(focusedElem) {
  var selection, range, sig;

  selection = focusedElem.ownerDocument.defaultView.getSelection();

  if (selection.rangeCount < 1) {
    return null;
  }

  range = selection.getRangeAt(0);

  /*? if(platform!=='mozilla'){ */
  // We're going to work around some weird OSX+Chrome/Safari behaviour where if you
  // right-click on a word it gets selected, which then causes us to render just
  // that one word and look dumb and be wrong.
  // Also, in OSX+Safari, right-clicking in empty space will cause a selection
  // that isn't collapsed, but has no content. Also ignore that.
  if ((range.toString().length === 0) ||
      ((typeof(chrome) !== 'undefined' || typeof(safari) !== 'undefined') &&
       typeof(navigator) !== 'undefined' &&
       navigator.userAgent.indexOf('OS X') >= 0 &&
       range.toString().match(/^\b\w+\b$/))) {
    range.collapse(true);
  }
  /*? } */

  if (range.collapsed) {
    // If there's no actual selection, select the contents of the focused element.
    range.selectNodeContents(focusedElem);
  }

  // Does our range include a signature? If so, remove it.
  sig = findSignatureStart(focusedElem);
  if (sig) {
    // If the sig is an element node, set a class indicating that it's a sig.
    // This gives us (or the user) the option of styling differently.
    if (sig.nodeType === sig.ELEMENT_NODE) {
      sig.classList.add('markdown-here-signature');
    }

    if (range.isPointInRange(sig, 0)) {
      range.setEndBefore(sig);
    }
  }

  return range;
}

// A signature is indicated by the last `'-- '` text node (or something like it).
// Returns the sig start element, or null if one is not found.
// NOTE: I would really prefer that this be in markdown-render.js with the other
// exclusion code. But I'm not sure how to find the sig as well without being
// able to traverse the DOM. (Surely with regexes and parsing... someday.)
function findSignatureStart(startElem) {
  var i, child, recurseReturn, sig;

  sig = null;

  for (i = 0; i < startElem.childNodes.length; i++) {
    child = startElem.childNodes[i];
    if (child.nodeType === child.TEXT_NODE) {
      // Thunderbird wraps the sig in a `<pre>`, so there's a newline.
      // Hand-written sigs (including Hotmail and Yahoo) are `'--&nbsp;'` (aka \u00a0).
      // Gmail auto-inserted sigs are `'-- '` (plain space).
      if (child.nodeValue.search(/^--[\s\u00a0]+(\n|$)/) === 0) {

        // Assume that the entire parent element belongs to the sig only if the
        // `'--'` bit is the at the very start of the parent.
        if (startElem.firstChild === child) {
          sig = startElem;
        }
        else {
          sig = child;
        }
      }
    }
    else if (['BLOCKQUOTE'].indexOf(child.nodeName) < 0) {
      recurseReturn = findSignatureStart(child, true);

      // Did the recursive call find it?
      if (recurseReturn) {
        sig = recurseReturn;
      }
    }
  }

  return sig;
}

// Replaces the contents of `range` with the HTML string in `html`.
// Returns the element that is created from `html`.
function replaceRange(range, html) {
  var documentFragment, newElement;

  range.deleteContents();

  // Create a DocumentFragment to insert and populate it with HTML
  documentFragment = range.createContextualFragment(html);

  documentFragment = Utils.sanitizeDocumentFragment(documentFragment);

  // After inserting the node contents, the node is empty. So we need to save a
  // reference to the element that we need to return.
  newElement = documentFragment.firstChild;

  range.insertNode(documentFragment);

  // Make sure the replacement is selected. This isn't strictly necessary, but
  // in order to make Chrome and Firefox consistent, we either need to remove
  // the selection in Chrome, or set it in Firefox. We'll do the latter.
  range.selectNode(newElement);

  return newElement;
}

// Returns the stylesheet for our styles.
function getMarkdownStylesheet(elem, css) {
  var styleElem, stylesheet, i;

  // We have to actually create a style element in the document, then pull the
  // stylesheet out of it (and remove the element).

  // Create a style element
  styleElem = elem.ownerDocument.createElement('style');
  styleElem.setAttribute('title', 'markdown-here-styles');

  // Set the CSS in the style element
  styleElem.appendChild(elem.ownerDocument.createTextNode(css));

  // Put the style element in the DOM under `elem`
  elem.appendChild(styleElem);

  // Find the stylesheet that we just created
  for (i = 0; i < elem.ownerDocument.styleSheets.length; i++) {
    if (elem.ownerDocument.styleSheets[i].title === 'markdown-here-styles') {
      stylesheet = elem.ownerDocument.styleSheets[i];
      break;
    }
  }

  if (!stylesheet) {
    throw 'Markdown Here stylesheet not found!';
  }

  // Take the stylesheet element out of the DOM
  elem.removeChild(styleElem);

  return stylesheet;
}

// Applies our styling explicitly to the elements under `wrapperElem`.
function makeStylesExplicit(wrapperElem, css) {
  var stylesheet, rule, selectorMatches, i, j, styleAttr, elem;

  stylesheet = getMarkdownStylesheet(wrapperElem, css);

  for (i = 0; i < stylesheet.cssRules.length; i++) {
    rule = stylesheet.cssRules[i];

    // Note that the CSS should not have any rules that use "body" or "html".

    // We're starting our search one level above the wrapper, which means we
    // might match stuff outside of our wrapper. We'll have to double-check below.
    selectorMatches = wrapperElem.parentNode.querySelectorAll(rule.selectorText);

    for (j = 0; j < selectorMatches.length; j++) {
      elem = selectorMatches[j];

      // Make sure the element is inside our wrapper (or is our wrapper).
      if (elem !== wrapperElem &&
          !Utils.isElementDescendant(wrapperElem, elem)) {
        continue;
      }

      // Make sure the selector match isn't inside an exclusion block.
      // The check for `elem.classList` stop us if we hit a non-element node
      // while going up through the parents.
      while (elem && (typeof(elem.classList) !== 'undefined')) {
        if (elem.classList.contains('markdown-here-exclude')) {
          elem = 'excluded';
          break;
        }
        elem = elem.parentNode;
      }
      if (elem === 'excluded') {
        // Don't style this element.
        continue;
      }

      // Get the existing styles for the element.
      styleAttr = selectorMatches[j].getAttribute('style') || '';

      // Append the new styles to the end of the existing styles. This will
      // give the new ones precedence if any are the same as existing ones.

      // Make sure existing styles end with a semicolon.
      if (styleAttr && styleAttr.search(/;[\s]*$/) < 0) {
        styleAttr += '; ';
      }

      styleAttr += rule.style.cssText;

      // Set the styles back.
      selectorMatches[j].setAttribute('style', styleAttr);
    }
  }
}

function hasParentElementOfTagName(element, tagName) {
  var parent;

  tagName = tagName.toUpperCase();

  parent = element.parentNode;
  while (parent) {
    if (parent.nodeName === tagName) {
      return true;
    }

    parent = parent.parentNode;
  }

  return false;
}


// Look for valid raw-MD-holder element under `elem`. Only MDH wrappers will
// have such an element.
// Returns null if no raw-MD-holder element is found; otherwise returns that element.
function findElemRawHolder(elem) {
  // A raw-MD-holder element has a specially prefixed title and must be an
  // immediate child of `elem`.
  //
  // To restrict our selector to only immediate children of elem, we would
  // use `:scope > whatever`, but scope is not supported widely enough yet.
  // See: https://developer.mozilla.org/en-US/docs/Web/CSS/:scope#Browser_compatibility
  //
  // If we just take the first `querySelector` result, we may get the wrong
  // raw-MD-holder element -- a grandchild -- and incorrectly assume that
  // `elem` is not a wrapper element. So we'll check all query results and
  // only return false if none of them are immediate children.
  // Here's an example of a failure case email if we didn't do that:
  //     New rendered MD in a reply here.
  //     On Thu, Aug 13, 2015 at 9:08 PM, Billy Bob wrote:
  //     | Rendered MD in original email here.
  //     | [invisible raw MD holder elem for original email]
  //     [invisible raw MD holder elem for reply]
  // `querySelector` would return the holder inside the original email.
  // This scenario is issue #297 https://github.com/adam-p/markdown-here/issues/297

  var rawHolders = elem.querySelectorAll('[title^="' + WRAPPER_TITLE_PREFIX + '"]');

  for (var i = 0; i < rawHolders.length; i++) {
    if (// The above `querySelector` will also look at grandchildren of
        // `elem`, which we don't want.
        rawHolders[i].parentNode === elem &&
        // Skip all wrappers that are in a `blockquote`. We don't want to revert
        // Markdown that was sent to us.
        !hasParentElementOfTagName(elem, 'BLOCKQUOTE')) {
      return rawHolders[i];
    }
  }

  return null;
}

// Determine if the given element is a MDH wrapper element.
function isWrapperElem(elem) {
  return true &&
    // Make sure the candidate is an element node
    elem.nodeType === elem.ELEMENT_NODE &&
    // And is not a blockquote, so we ignore replies
    elem.tagName.toUpperCase() !== 'BLOCKQUOTE' &&
    // And has a raw-MD-holder element
    findElemRawHolder(elem) !== null;
}


// Find the wrapper element that's above the current cursor position and returns
// it. Returns falsy if there is no wrapper.
function findMarkdownHereWrapper(focusedElem) {
  var selection, range, wrapper = null;

  selection = focusedElem.ownerDocument.defaultView.getSelection();

  if (selection.rangeCount < 1) {
    return null;
  }

  range = selection.getRangeAt(0);

  wrapper = range.commonAncestorContainer;
  while (wrapper && !isWrapperElem(wrapper)) {
    wrapper = wrapper.parentNode;
  }

  return wrapper;
}


// Finds all Markdown Here wrappers in the given range. Returns an array of the
// wrapper elements, or null if no wrappers found.
function findMarkdownHereWrappersInRange(range) {
  // Adapted from: http://stackoverflow.com/a/1483487/729729
  var containerElement = range.commonAncestorContainer;
  if (containerElement.nodeType != containerElement.ELEMENT_NODE) {
    containerElement = containerElement.parentNode;
  }

  var elems = [];

  var nodeTester = function(elem) {
    if (elem.nodeType === elem.ELEMENT_NODE &&
        Utils.rangeIntersectsNode(range, elem) &&
        isWrapperElem(elem)) {
          elems.push(elem);
    }
  };

  Utils.walkDOM(containerElement, nodeTester);

  /*
  // This code is probably superior, but TreeWalker is not supported by Postbox.
  // If this ends up getting used, it should probably be moved into walkDOM
  // (or walkDOM should be removed).
  var nodeTester = function(node) {
    if (node.nodeType !== node.ELEMENT_NODE ||
        !Utils.rangeIntersectsNode(range, node) ||
        !isWrapperElem(node)) {
      return node.ownerDocument.defaultView.NodeFilter.FILTER_SKIP;
    }

    return node.ownerDocument.defaultView.NodeFilter.FILTER_ACCEPT;
  };

  var treeWalker = containerElement.ownerDocument.createTreeWalker(
      containerElement,
      containerElement.ownerDocument.defaultView.NodeFilter.SHOW_ELEMENT,
      nodeTester,
      false);

  var elems = [];
  while (treeWalker.nextNode()) {
    elems.push(treeWalker.currentNode);
  }
  */

  return elems.length ? elems : null;
}


// Converts the Markdown in the user's compose element to HTML and replaces it.
// If `selectedRange` is null, then the entire email is being rendered.
function renderMarkdown(focusedElem, selectedRange, markdownRenderer, renderComplete) {
  var originalHtml = Utils.getDocumentFragmentHTML(selectedRange.cloneContents());

  // Call to the extension main code to actually do the md->html conversion.
  markdownRenderer(focusedElem, selectedRange, function(mdHtml, mdCss) {
    var wrapper, rawHolder;

    // Store the original Markdown-in-HTML to the `title` attribute of a separate,
    // invisible-ish `div`. We have found that Gmail, Evernote, etc. leave the
    // title intact when saving.
    // `&#8203;` is a zero-width space: https://en.wikipedia.org/wiki/Zero-width_space
    // Thunderbird will discard the `div` if there's no content.
    rawHolder = '<div ' +
                'title="' + WRAPPER_TITLE_PREFIX + Utils.utf8StringToBase64(originalHtml) + '" ' +
                'style="height:0;width:0;max-height:0;max-width:0;overflow:hidden;font-size:0em;padding:0;margin:0;" ' +
                '>&#8203;</div>';

    // Wrap our pretty HTML in a <div> wrapper.
    // We'll use the wrapper as a marker to indicate that we're in a rendered state.
    mdHtml =
      '<div class="markdown-here-wrapper" ' +
           'data-md-url="' + Utils.getTopURL(focusedElem.ownerDocument.defaultView, true) + '">' +
        mdHtml +
        rawHolder +
      '</div>';

    wrapper = replaceRange(selectedRange, mdHtml);

    // Some webmail (Gmail) strips off any external style block. So we need to go
    // through our styles, explicitly applying them to matching elements.
    makeStylesExplicit(wrapper, mdCss);

    // Monitor for changes to the content of the rendered MD. This will help us
    // prevent the user from silently losing changes later.
    // We're going to set this up after a short timeout, to help prevent false
    // detections based on automatic changes by the host site.
    wrapper.ownerDocument.defaultView.setTimeout(function addMutationObserver() {
      var SupportedMutationObserver =
            wrapper.ownerDocument.defaultView.MutationObserver ||
            wrapper.ownerDocument.defaultView.WebKitMutationObserver;
      if (typeof(SupportedMutationObserver) !== 'undefined') {
        var observer = new SupportedMutationObserver(function(mutations) {
          wrapper.setAttribute('markdown-here-wrapper-content-modified', true);
          observer.disconnect();
        });
        observer.observe(wrapper, { childList: true, characterData: true, subtree: true });
      }
    }, 100);

    renderComplete();
  });
}

// Revert the rendered Markdown wrapperElem back to its original form.
function unrenderMarkdown(wrapperElem) {
  var rawHolder = findElemRawHolder(wrapperElem);
  // Not checking for success of that call, since we shouldn't be here if there
  // isn't a wrapper.

  var originalMdHtml = rawHolder.getAttribute('title');
  originalMdHtml = originalMdHtml.slice(WRAPPER_TITLE_PREFIX.length).replace(/\n/g, '');

  // Thunderbird and Postbox break the long title up into multiple lines, which
  // wrecks our ability to un-base64 it. So strip whitespace.
  originalMdHtml = originalMdHtml.replace(/\s/g, '');

  originalMdHtml = Utils.base64ToUTF8String(originalMdHtml);

  Utils.saferSetOuterHTML(wrapperElem, originalMdHtml);
}

// Exported function.
// The context menu handler. Does the rendering or unrendering, depending on the
// state of the email compose element and the current selection.
// @param `document`  The document object containing the email compose element.
//        (Actually, it can be any document above the compose element. We'll
//        drill down to find the correct element and document.)
// @param `markdownRenderer`  The function that provides raw-Markdown-in-HTML
//                            to pretty-Markdown-in-HTML rendering service.
// @param `logger`  A function that can be used for logging debug messages. May
//                  be null.
// @param `renderComplete`  Callback that will be called when a render or unrender
//                          has completed. Passed two arguments: `elem`
//                          (the element de/rendered) and `rendered` (boolean,
//                          true if rendered, false if derendered).
// @returns True if successful, otherwise an error message that should be shown
//          to the user.
function markdownHere(document, markdownRenderer, logger, renderComplete) {

  if (logger) {
    mylog = logger;
  }

  // If the cursor (or current selection) is in a Markdown Here wrapper, then
  // we're reverting that wrapper back to Markdown. If there's a selection that
  // contains one or more wrappers, then we're reverting those wrappers back to
  // Markdown.
  // Otherwise, we're rendering. If there's a selection, then we're rendering
  // the selection. If not, then we're rendering the whole email.

  var wrappers, outerWrapper, focusedElem, range, i;

  focusedElem = findFocusedElem(document);
  if (!focusedElem || !focusedElem.ownerDocument) {
    return 'Could not find focused element';
  }

  // Look for existing rendered-Markdown wrapper to revert.
  outerWrapper = findMarkdownHereWrapper(focusedElem);
  if (outerWrapper) {
    // There's a wrapper above us.
    wrappers = [outerWrapper];
  }
  else {
    // Are there wrappers in our selection?

    range = getOperationalRange(focusedElem);

    if (!range) {
      return Utils.getMessage('nothing_to_render');
    }

    // Look for wrappers in the range under consideration.
    wrappers = findMarkdownHereWrappersInRange(range);
  }

  // If we've found wrappers, then we're reverting.
  // Otherwise, we're rendering.
  if (wrappers && wrappers.length > 0) {
    var yesToAll = false;
    for (i = 0; i < wrappers.length; i++) {
      // Has the content been modified by the user since rendering
      if (wrappers[i].getAttribute('markdown-here-wrapper-content-modified') &&
          !yesToAll) {

          if (wrappers[i].ownerDocument.defaultView.confirm(Utils.getMessage('unrendering_modified_markdown_warning'))) {
            yesToAll = true;
          }
          else {
            break;
          }
      }

      unrenderMarkdown(wrappers[i]);
    }

    if (renderComplete) {
      renderComplete(focusedElem, false);
    }
  }
  else {
    renderMarkdown(
      focusedElem,
      range,
      markdownRenderer,
      function() {
        if (renderComplete) {
          renderComplete(focusedElem, true);
        }
      });
  }

  return true;
}

// We also export a couple of utility functions
markdownHere.findFocusedElem = findFocusedElem;
markdownHere.elementCanBeRendered = elementCanBeRendered;

var EXPORTED_SYMBOLS = ['markdownHere'];

if (typeof module !== 'undefined') {
  module.exports = markdownHere;
} else {
  this.markdownHere = markdownHere;
  this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
