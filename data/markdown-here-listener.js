/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

'use strict';

// Used to create unique IDs for each Markdown Here wrapper.
var markdownHereWrapperIdCounter = 1;

// Finds and returns the page element that currently has focus. Drills down into
// iframes if necessary.
function findFocusedElem() {
  var focusedElem = document.activeElement;

  // If the focus is within an iframe, we'll have to drill down to get to the
  // actual element.
  while (focusedElem && focusedElem.contentDocument) {
    focusedElem = focusedElem.contentDocument.activeElement;
  }

  return focusedElem;
}

// Get the currectly selected range.
function getSelectedRange(contentDocument) {
  var selection, range;

  selection = contentDocument.getSelection();
  range = selection.getRangeAt(0);
  if (range.collapsed) {
    return null;
  }

  return range;
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

// Returns the stylesheet for our styles.
function getMarkdownStylesheet(elem, css) {
  var styleElem, stylesheet, i;

  // Create a style element under elem
  styleElem = elem.ownerDocument.createElement('style');
  styleElem.setAttribute('title', 'markdown-here-styles');
  styleElem.appendChild(document.createTextNode(css));

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

// Applies our styling explicitly to the elements under `elem`.
function makeStylesExplicit(wrapperElem, css) {
  var stylesheet, rule, selectorMatches, i, j;

  stylesheet = getMarkdownStylesheet(wrapperElem, css);

  for (i = 0; i < stylesheet.cssRules.length; i++) {
    rule = stylesheet.cssRules[i];

    // Special case for the selector: If the selector is '.markdown-here-wrapper',
    // then we want to apply the rules to the wrapper (not just to its ancestors,
    // which is what querySelectorAll gives us).
    // Note that the CSS should not have any rules that use "body" or "html".

    if (rule.selectorText === '.markdown-here-wrapper') {
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
      if (wrapper.attributes[i].value === 'markdown-here-wrapper') {
        match = true;
        break;
      }
    }

    if (match) break;

    wrapper = wrapper.parentNode;
  }

  return wrapper;
}

// Finds all Markdown Here wrappers in the given range. Returns an array of the
// wrapper elements, or null if no wrappers found.
function findMarkdownHereWrappersInRange(range) {
  var documentFragment, cloneWrappers, wrappers, selection, i;

  // Finding elements in a range isn't very simple...

  documentFragment = range.cloneContents();

  cloneWrappers = documentFragment.querySelectorAll('.markdown-here-wrapper');

  if (cloneWrappers && cloneWrappers.length > 0) {
    // Now we have an array of *copies* of the wrappers in the DOM. Find them in
    // the DOM from their IDs.
    wrappers = [];
    for (i = 0; i < cloneWrappers.length; i++) {
      wrappers.push(range.commonAncestorContainer.ownerDocument.getElementById(cloneWrappers[i].id));
    }

    return wrappers;
  }
  else {
    return null;
  }
}

// Converts the Markdown in the user's compose element to HTML and replaces it.
function renderMarkdown(selectedRange) {
  var extractedHtml, replacingSelection, focusedElem, rangeWrapper;

  focusedElem = findFocusedElem();
  if (!focusedElem || !focusedElem.ownerDocument) {
    return;
  }

  replacingSelection = !!selectedRange;

  // Get the HTML containing the Markdown from either the selection or compose element.

  if (replacingSelection) {
    rangeWrapper = focusedElem.ownerDocument.createElement('div');

    // This modifies the DOM, but that's okay, since we're going to replace the
    // new element in a moment.
    selectedRange.surroundContents(rangeWrapper);

    extractedHtml = rangeWrapper.innerHTML;
  }
  else {
    extractedHtml = focusedElem.innerHTML;
  }

  // Call to the extension main code to actually do the md->html conversion.
  requestMarkdownConversion(extractedHtml, function(mdHtml, mdCss) {
    var wrapper;

    // Wrap our pretty HTML in a <div> wrapper.
    // We'll use the wrapper as a marker to indicate that we're in a rendered state.
    mdHtml =
      '<div class="markdown-here-wrapper" id="markdown-here-wrapper-' + (markdownHereWrapperIdCounter++) + '">' +
      mdHtml +
      '</div>';

    // Store the original Markdown-in-HTML to a data attribute on the wrapper
    // element. We'll use this later if we need to unrender back to Markdown.

    if (selectedRange) {
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
    makeStylesExplicit(wrapper, mdCss);
  });
}

// Revert the rendered Markdown wrapperElem back to its original form.
function unrenderMarkdown(wrapperElem) {
  wrapperElem.outerHTML = wrapperElem.getAttribute('data-md-original');
}

// The context menu handler.
function doMarkdownHereToggle() {

  // If the cursor (or current selection) is in a Markdown Here wrapper, then
  // we're reverting that wrapper back to Markdown. If there's a selection that
  // contains one or more wrappers, then we're reverting those wrappers back to
  // Markdown.
  // Otherwise, we're rendering. If there's a selection, then we're rendering
  // the selection. If not, then we're rendering the whole email.

  var wrappers, outerWrapper, focusedElem, range, i;

  outerWrapper = findMarkdownHereWrapper();
  if (outerWrapper) {
    wrappers = [outerWrapper];
  }
  else {
    focusedElem = findFocusedElem();
    if (focusedElem) {
      range = getSelectedRange(focusedElem.ownerDocument);
    }

    if (range) {
      wrappers = findMarkdownHereWrappersInRange(range);
    }
  }

  // If we've found wrappers, then we're reverting.
  // Otherwise, we're rendering.
  if (wrappers && wrappers.length > 0) {
    for (i = 0; i < wrappers.length; i++) {
      unrenderMarkdown(wrappers[i]);
    }
  }
  else {
    renderMarkdown(range);
  }
}
