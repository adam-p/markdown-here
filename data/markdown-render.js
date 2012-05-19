/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

;(function() {

  function markdownRender(htmlToText, markdownToHtml, html) {
    var extractedText;

    function tagReplacement(text) {
      var replaced =
        text
          .replace(/<div[^>]*>/ig, '<br>') // opening <div> --> <br>
          .replace(/<\/div>/ig, '')        // closing </div> --> nothing
          .replace(/&nbsp;/ig, ' ');       // &nbsp; --> space
      return replaced;
    }

    extractedText = htmlToText(html, {tagreplacement: tagReplacement});

    return markdownToHtml(extractedText);
  }

  if (typeof module !== 'undefined') {
    module.exports = markdownRender;
  } else {
    this.markdownRender = markdownRender;
  }

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
