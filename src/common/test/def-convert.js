/* Test the convertHTMLtoMarkdown function whether can handle def pattern correctly.
 * Test cases:
 * [label]: http://<a href="http://example.com" target="_blank">example.com</a>
 * [label]: <a href="http://example.com" target="_blank">http://example.com</a>
 * [text](<a href="http://example.com" target="_blank">http://example.com</a>)
 * Expect results:
 * All of them should be unchanged
 */

function convert() {
  var convertHTMLtoMarkdown = MdhHtmlToText._testExports.convertHTMLtoMarkdown;
  var case1 = '[label]: http://<a href="http://example.com" target="_blank">example.com</a>'
  var case2 = '[label]: <a href="http://example.com" target="_blank">http://example.com</a>'
  var case3 = '[text](<a href="http://example.com" target="_blank">http://example.com</a>)'

  var result1 = convertHTMLtoMarkdown('a', case1);
  var result2 = convertHTMLtoMarkdown('a', case2);
  var result3 = convertHTMLtoMarkdown('a', case3);

  if (result1 !== case1 || result2 !== case2 || result3 !== case3) {
    window.alert("convertHTMLtoMarkdown generate false MD links!");
  }
};

