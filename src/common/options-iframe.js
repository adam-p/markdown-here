/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

function onLoad() {
  // The body of the iframe needs to have a (collapsed) selection range for
  // Markdown Here to work (simulating focus/cursor).
  var range = document.createRange();
  range.setStart(document.body, 0);
  var sel = document.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  // Let our owner page know that we've loaded.
  var e = top.document.createEvent('HTMLEvents');
  e.initEvent('options-iframe-loaded', true, true);
  top.document.dispatchEvent(e);
}
document.addEventListener('DOMContentLoaded', onLoad, false);
