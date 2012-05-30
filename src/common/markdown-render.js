/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

/*
 * The function that does the basic raw-Markdown-in-HTML to rendered-HTML
 * conversion.
 * The reason we keep this function -- specifically, the function that uses our
 * external markdown renderer (marked.js), text-from-HTML module (jsHtmlToText.js),
 * and CSS -- separate is that it allows us to keep the bulk of the rendering
 * code (and the bulk of the code in our extension) out of the content script.
 * That way, we minimize the amount of code that needs to be loaded in every page.
 */

;(function() {

  // Using the functionality provided by the functions htmlToText and markdownToHtml,
  // render html into pretty text.
  function markdownRender(htmlToText, markdownToHtml, html) {
    var extractedText;

    // We need to tweak the html-to-text processing to get the results we want.
    function tagReplacement(text) {
      var replaced =
        text
          .replace(/<div[^>]*>/ig, '<br>') // opening <div> --> <br>
          .replace(/<\/div>/ig, '')        // closing </div> --> nothing
          .replace(/&nbsp;/ig, ' ');       // &nbsp; --> space
      return replaced;
    }

    extractedText = htmlToText(html, {tagreplacement: tagReplacement, allowTrailingWhitespace: true});

    return markdownToHtml(extractedText);
  }

  var EXPORTED_SYMBOLS = ['markdownRender'];

  if (typeof module !== 'undefined') {
    module.exports = markdownRender;
  } else {
    this.markdownRender = markdownRender;
    this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;
  }

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
