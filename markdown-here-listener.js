/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

// Finds and returns the page element that currently has focus. Drills down into
// iframes if necessary.
function findFocusedElem() {
  var focusedElem = document.activeElement;

  // If the focus is within an iframe, we'll have to drill down to get to the
  // actual element.
  while (focusedElem['contentDocument'])
  {
      focusedElem = focusedElem.contentDocument.activeElement;
  }

  return focusedElem;
}

// Get the plaintext representation of the given element's inner HTML.
function extractTextFromElem(elem) {
  var extractedHtml, extractedText;

  extractedHtml = $(elem).html();

  function tagreplacement(text) {
    var replaced =
      text
        .replace(/<div[^>]*>/ig, '<br>') // opening <div> --> <br>
        .replace(/<\/div>/ig, '')           // closing </div> --> nothing
        .replace(/&nbsp;/ig, ' ');         // &nbsp; --> space
    return replaced;
  }

  extractedText = htmlToText(extractedHtml, {tagreplacement: tagreplacement});
  return extractedText;
}

// Uses marked.js
function markedToHtml(md) {
  var html = marked(md);
  return html;
}

// The cotext menu handler.
chrome.extension.onRequest.addListener(function(event) {
  var $focusedElem, md, mdHtml;

  if (event != 'markdown-here') return;

  $focusedElem = $(findFocusedElem());
  md = extractTextFromElem($focusedElem);
  mdHtml = markedToHtml(md);

  $focusedElem.html(styles+mdHtml);
});
