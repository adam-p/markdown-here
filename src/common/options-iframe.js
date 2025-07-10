/*
 * Copyright Adam Pritchard 2015
 * MIT License : https://adampritchard.mit-license.org/
 */

function onLoad() {
  // The body of the iframe needs to have a (collapsed) selection range for
  // Markdown Here to work (simulating focus/cursor).
  const range = document.createRange();
  range.setStart(document.body, 0);
  const sel = document.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const demoMarkdown = Utils.getMessage('options_page__preview_markdown');
  Utils.saferSetInnerHTML(document.body, demoMarkdown);
}
document.addEventListener('DOMContentLoaded', onLoad, false);
