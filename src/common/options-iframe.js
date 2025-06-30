/*
 * Copyright Adam Pritchard 2015
 * MIT License : https://adampritchard.mit-license.org/
 */

function onLoad() {
  // Chrome/WebExtensions require us to manually load our content script in order
  // to use the button and context menu in the iframe.
  window.LOAD_MARKDOWN_HERE_CONTENT_SCRIPT = true;
  const contentscript = document.createElement('script');
  contentscript.src = '../chrome/contentscript.js';
  document.body.appendChild(contentscript);

  // The body of the iframe needs to have a (collapsed) selection range for
  // Markdown Here to work (simulating focus/cursor).
  const range = document.createRange();
  range.setStart(document.body, 0);
  const sel = document.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  // This is an asynchrous call that must complete before we notify the parent
  // window that we've completed loading.
  localize();
}
document.addEventListener('DOMContentLoaded', onLoad, false);


// Basically copied from options.js
function localize() {
  Utils.registerStringBundleLoadListener(function localizeHelper() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(function(element) {
      const messageID = 'options_page__' + element.dataset.i18n;
      if (element.tagName.toUpperCase() === 'TITLE') {
        element.innerText = Utils.getMessage(messageID);
      }
      else {
        Utils.saferSetInnerHTML(element, Utils.getMessage(messageID));
      }
    });

    notifyIframeLoaded();
  });
}


function notifyIframeLoaded() {
  // Let our owner page know that we've loaded.
  const e = new CustomEvent('options-iframe-loaded', {
    bubbles: true,
    cancelable: true
  });
  top.document.dispatchEvent(e);
}
