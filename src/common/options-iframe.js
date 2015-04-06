/*
 * Copyright Adam Pritchard 2015
 * MIT License : http://adampritchard.mit-license.org/
 */

function onLoad() {
  /*? if(platform!=='mozilla'){ */
  // Chrome and Safari require us to manually load our content script in order
  // to use the button and context menu in the iframe.
  if (typeof(safari) !== 'undefined' || typeof(chrome) !== 'undefined') {
    window.LOAD_MARKDOWN_HERE_CONTENT_SCRIPT = true;
    var contentscript = document.createElement('script');
    if (typeof(safari) !== 'undefined') {
      contentscript.src = '../../../contentscript.js';
    }
    else if (typeof(chrome) !== 'undefined') {
      contentscript.src = '../chrome/contentscript.js';
    }
    document.body.appendChild(contentscript);
  }
  /*? } */

  // The body of the iframe needs to have a (collapsed) selection range for
  // Markdown Here to work (simulating focus/cursor).
  var range = document.createRange();
  range.setStart(document.body, 0);
  var sel = document.getSelection();
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
    $('[data-i18n]').each(function() {
      var messageID = 'options_page__' + $(this).data('i18n');
      if (this.tagName.toUpperCase() === 'TITLE') {
        this.innerText = Utils.getMessage(messageID);
      }
      else {
        Utils.saferSetInnerHTML(this, Utils.getMessage(messageID));
      }
    });

    notifyIframeLoaded();
  });
}


function notifyIframeLoaded() {
  // Let our owner page know that we've loaded.
  var e = top.document.createEvent('HTMLEvents');
  e.initEvent('options-iframe-loaded', true, true);
  top.document.dispatchEvent(e);
}
