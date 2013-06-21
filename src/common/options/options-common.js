/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*global OptionsStore:false, chrome:false, markdownRender:false, $:false,
  htmlToText:false, marked:false, hljs:false, markdownHere:false, Utils:false*/


var OptionsCommon = (function() {
  // Render the sample Markdown.
  function renderMarkdown(requestMarkdownConversion, postRenderCallback) {
    if ($('#rendered-markdown')[0].contentDocument.querySelector('.markdown-here-wrapper')) {
      // Already rendered.
      if (postRenderCallback) postRenderCallback();
      return;
    }

    // Begin rendering.
    markdownHere($('#rendered-markdown')[0].contentDocument, requestMarkdownConversionInterceptor);

    // To figure out when the (asynchronous) rendering is complete -- so we
    // can call the `postRenderCallback` -- we'll intercept the callback used
    // by the rendering service.

    function requestMarkdownConversionInterceptor(html, callback) {

      function callbackInterceptor() {
        callback.apply(null, arguments);

        // Rendering done. Call callback.
        if (postRenderCallback) postRenderCallback();
      }

      // Call the real rendering service.
      requestMarkdownConversion(html, callbackInterceptor);
    }
  }


  // Re-render already-rendered sample Markdown.
  function updateMarkdownRender(requestMarkdownConversion) {
    if (!$('#rendered-markdown')[0].contentDocument.querySelector('.markdown-here-wrapper')) {
      // Not currently rendered, so nothing to update.
      return;
    }

    // To mitigate flickering, hide the iframe during rendering.
    $('#rendered-markdown')[0].style.visibility = 'hidden';

    // Unrender
    markdownHere($('#rendered-markdown')[0].contentDocument, requestMarkdownConversion);

    // Re-render
    renderMarkdown(
      requestMarkdownConversion,
      function() { $('#rendered-markdown')[0].style.visibility = 'visible';});
  }

  return {
    renderMarkdown: renderMarkdown,
    updateMarkdownRender: updateMarkdownRender
  };
})();