/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

'use strict';

// Finds and returns the page element that currently has focus. Drills down into
// iframes if necessary.
function findFocusedElem() {
  var focusedElem = document.activeElement;

  // If the focus is within an iframe, we'll have to drill down to get to the
  // actual element.
  while (focusedElem.contentDocument != null) {
    focusedElem = focusedElem.contentDocument.activeElement;
  }

  return focusedElem;
}

// Get the currectly selected range, or an expanded version thereof.
// The selection may start or end in text nodes, which is isn't what we want. So
// we'll expand the selection to include only whole element nodes.
function getSelectedRange(contentDocument) {
  var selection, range;

  selection = contentDocument.getSelection();
  range = selection.getRangeAt(0);
  if (range.collapsed) {
    return null;
  }

  if (range.startContainer.nodeType === range.startContainer.TEXT_NODE) {
    range.setStartBefore(range.startContainer.parentNode);
  }

  if (range.endContainer.nodeType === range.endContainer.TEXT_NODE) {
    range.setEndAfter(range.endContainer.parentNode);
  }

  return range;
}

// Get the HTML from `selectedRange`.
function getSelectedHtml(selectedRange) {
  var selectedHtml = '', rangeContents, i;

  // We're basically just concatenating the outerHTML of the top-level elements.

  rangeContents = selectedRange.cloneContents();

  for (i = 0; i < rangeContents.childNodes.length; i++) {
    selectedHtml += rangeContents.childNodes[i].outerHTML;
  }

  return selectedHtml;
}

// Replaces the contents of `range` with the HTML string in `html`.
// Returns the element that is created from `html`.
function replaceRange(range, html) {
  var documentFragment, newElement;

  range.deleteContents();

  // Create a DocumentFragment to insert and populate it with HTML
  documentFragment = range.createContextualFragment(html);

  // After inserting the node contents, the node is empty. So we need to save a
  // reference to the element that we need to return.
  newElement = documentFragment.firstChild;

  range.insertNode(documentFragment);

  return newElement;
}

// Get the plaintext representation of the given HTML.
// Uses jsHtmlToText.js
function plaintextFromHtml(html) {
  var extractedText;

  function tagReplacement(text) {
    var replaced =
      text
        .replace(/<div[^>]*>/ig, '<br>') // opening <div> --> <br>
        .replace(/<\/div>/ig, '')        // closing </div> --> nothing
        .replace(/&nbsp;/ig, ' ');       // &nbsp; --> space
    return replaced;
  }

  extractedText = htmlToText(html, {tagreplacement: tagReplacement});
  return extractedText;
}

// Convert the Markdown in `md` to HTML.
// Uses marked.js
function markdownToHtml(md) {
  var html = marked(md);
  return html;
}

// Returns the stylesheet for our styles.
function getMarkdownStylesheet(elem) {
  var styleElem, stylesheet, i;

  // Create a style element under elem
  styleElem = elem.ownerDocument.createElement('style');
  styleElem.setAttribute('title', 'markdown-here-styles');
  styleElem.appendChild(document.createTextNode(MARKDOWN_HERE_STYLES));

  elem.appendChild(styleElem);

  // Find the stylesheet that we just created
  for (i = 0; i < elem.ownerDocument.styleSheets.length; i++) {
    if (elem.ownerDocument.styleSheets[i].title === 'markdown-here-styles') {
      stylesheet = elem.ownerDocument.styleSheets[i];
      break;
    }
  }

  if (stylesheet == null) {
    throw 'Markdown Here stylesheet not found!';
  }

  // Take the stylesheet element out of the DOM
  elem.removeChild(styleElem);

  return stylesheet;
}

// Applies our styling explicitly to the elements under `elem`.
function makeStylesExplicit(wrapperElem) {
  var stylesheet, rule, selectorMatches, i, j;

  stylesheet = getMarkdownStylesheet(wrapperElem);

  for (i = 0; i < stylesheet.rules.length; i++) {
    rule = stylesheet.rules[i];

    // Special case for the selector: If the selector is '.markdown-here-wrapper'
    // or 'body', then we want to apply the rules to the wrapper (not just to
    // its ancestors, which is what querySelectorAll gives us).

    if (rule.selectorText === '.markdown-here-wrapper'
        || rule.selectorText === 'body') {
      wrapperElem.setAttribute('style', rule.style.cssText);
    }
    else {
      selectorMatches = wrapperElem.querySelectorAll(rule.selectorText);
      for (j = 0; j < selectorMatches.length; j++) {
        selectorMatches[j].setAttribute('style', rule.style.cssText);
      }
    }
  }
}

// Converts the Markdown in the user's compose element to HTML and replaces it.
function renderMarkdown() {
  var selectedRange, extractedHtml, md, mdHtml, replacingSelection, wrapper, focusedElem;

  focusedElem = findFocusedElem();
  if (!focusedElem || !focusedElem.ownerDocument) {
    return;
  }

  selectedRange = getSelectedRange(focusedElem.ownerDocument);
  replacingSelection = !!selectedRange;

  // Get the HTML containing the Markdown from either the selection or compose element.

  if (replacingSelection) {
    extractedHtml = getSelectedHtml(selectedRange);
  }
  else {
    extractedHtml = focusedElem.innerHTML;
  }

  // Extract the plaintext Markdown from the HTML.
  md = plaintextFromHtml(extractedHtml);

  // Render the Markdown to pretty HTML.
  mdHtml = markdownToHtml(md);

  // Wrap our pretty HTML in a <div> wrapper.
  // We'll use the wrapper as a marker to indicate that we're in a rendered state.
  mdHtml = '<div class="markdown-here-wrapper">' + mdHtml + '</div>';

  // Store the original Markdown-in-HTML to a data attribute on the wrapper
  // element. We'll use this later if we need to unrender back to Markdown.

  if (replacingSelection) {
    wrapper = replaceRange(selectedRange, mdHtml);
    wrapper.setAttribute('data-md-original', extractedHtml);
  }
  else {
    focusedElem.innerHTML = mdHtml;
    focusedElem.firstChild.setAttribute('data-md-original', extractedHtml);
    wrapper = focusedElem.firstChild;
  }

  // Some webmail (Gmail) strips off any external style block. So we need to go
  // through our styles, explicitly applying them to matching elements.
  makeStylesExplicit(wrapper);
}

// Revert the rendered Markdown wrapperElem back to its original form.
function unrenderMarkdown(wrapperElem) {
  wrapperElem.outerHTML = wrapperElem.getAttribute('data-md-original');
}

// Find the wrapper element that's above the current cursor position and returns
// it. Returns falsy if there is no wrapper.
function findMarkdownHereWrapper() {
  var focusedElem, selection, range, wrapper, match, i;

  focusedElem = findFocusedElem();
  if (!focusedElem) {
    return;
  }

  selection = focusedElem.ownerDocument.getSelection();
  range = selection.getRangeAt(0);

  wrapper = range.commonAncestorContainer;
  while (wrapper) {
    match = false;
    for (i = 0; wrapper.attributes && i < wrapper.attributes.length; i++) {
      if (wrapper.attributes[i].nodeValue === 'markdown-here-wrapper') {
        match = true;
        break;
      }
    }

    if (match) break;

    wrapper = wrapper.parentNode;
  }

  return wrapper;
}

// The context menu handler.
chrome.extension.onRequest.addListener(function(event) {
  var wrapperElem = findMarkdownHereWrapper();

  // If there's a wrapper above our current cursor position, then we're reverting.
  // Otherwise, we're rendering.
  if (!wrapperElem) {
    renderMarkdown();
  }
  else {
    unrenderMarkdown(wrapperElem);
  }
});
