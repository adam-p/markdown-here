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

  /** 
   Using the functionality provided by the functions htmlToText and markdownToHtml,
   render html into pretty text.
   @param targetDocument  The document object where the action is taking place. 
                          It will be used to create elements, but those elements 
                          will not be inserted into the DOM.
   */
  function markdownRender(htmlToText, markdownToHtml, syntaxHighlighter, html, targetDocument) {
    var extractedText, markedOptions;

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

    markedOptions = {
      gfm: true,
      pedantic: false,
      sanitize: false,
      highlight: function(codeText, codeLanguage) {                 
                    return highlightSyntax(
                              targetDocument, 
                              syntaxHighlighter, 
                              codeText, 
                              codeLanguage); }
      };

    return markdownToHtml(extractedText, markedOptions);
  }

  // Using `syntaxHighlighter`, highlight the code in `codeText` that is of
  // language `codeLanguage` (may be falsy). 
  // `syntaxHighlighter` is expected to behave like (i.e., to be) highlight.js.
  function highlightSyntax(targetDocument, syntaxHighlighter, codeText, codeLanguage) {
    var codeElem, preElem, textNode;

    // highlight.js requires a `<code>` element to be passed in that has a 
    // `<pre>` parent element.

    preElem = targetDocument.createElement('pre');
    codeElem = targetDocument.createElement('code');
    textNode = targetDocument.createTextNode(codeText);
    codeElem.appendChild(textNode);
    preElem.appendChild(codeElem);

    // If we're told the language, set it as a class so that the highlighter
    // doesn't have to guess it. This is part of the HTML5 standard. See:
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/text-level-semantics.html#the-code-element
    if (codeLanguage && codeLanguage.length > 0) {
      codeElem.setAttribute('class', 'language-'+codeLanguage);
    }
    else {
      codeElem.setAttribute('class', 'no-highlight');
    }

    syntaxHighlighter.highlightBlock(codeElem);

    return codeElem.innerHTML;
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
