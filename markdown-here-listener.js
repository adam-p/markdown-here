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

// Get the plaintext representation of the given HTML.
function plaintextFromHtml(html) {
  var extractedText;

  function tagreplacement(text) {
    var replaced =
      text
        .replace(/<div[^>]*>/ig, '<br>') // opening <div> --> <br>
        .replace(/<\/div>/ig, '')        // closing </div> --> nothing
        .replace(/&nbsp;/ig, ' ');       // &nbsp; --> space
    return replaced;
  }

  extractedText = htmlToText(html, {tagreplacement: tagreplacement});
  return extractedText;
}

// Uses marked.js
function markdownToHtml(md) {
  var html = marked(md);
  return html;
}

// Render the Markdown found in `$elem` into pretty HTML and put it back into `$elem`.
function renderMarkdown($elem) {
  var extractedHtml, md, mdHtml, marker;

  // Get the HTML containing the Markdown from the compose element.
  extractedHtml = $elem.html();

  // Extract the plaintext Markdown from the HTML.
  md = plaintextFromHtml(extractedHtml);

  // Render the Markdown to pretty HTML.
  mdHtml = markdownToHtml(md);

  // Store the original Markdown-in-HTML to a data attribute on the compose
  // element. We'll use this later if we need to unrender back to Markdown.
  $elem.data('markdown-here-original', extractedHtml);

  // We'll add a non-visible marker to indicate that we're in a rendered state.
  marker = '<div id="markdown-here-rendered" style="display:none;"></div>';

  // Output the styling and rendered Markdown back into the compose element.
  // `styles` comes from our JS'd CSS file.
  $elem.html(styles + mdHtml + marker);
}

// Revert the rendered-from-Markdown HTML found in `$elem` back into Markdown and
// put it back into `$elem`.
function unrenderMarkdown($elem) {
  var originalHtml;

  // Get the original Markdown-in-HTML that we stored when rendering.
  originalHtml = $elem.data('markdown-here-original');
  if (!originalHtml) {
    alert('Unable to revert to Markdown. Original not found.');
  }

  // Replace the contents of the element with the original Markdown.
  $elem.html(originalHtml);
}

function inRenderedState($elem) {
  return $elem.find('#markdown-here-rendered').length > 0;
}

// The context menu handler.
chrome.extension.onRequest.addListener(function(event) {
  var $focusedElem, initiallyRendered;

  $focusedElem = $(findFocusedElem());
  if (!$focusedElem) return;

  initiallyRendered = inRenderedState($focusedElem);

  // Toggle our rendered state.
  if (!initiallyRendered) {
    renderMarkdown($focusedElem);
  }
  else {
    unrenderMarkdown($focusedElem);
  }
});
