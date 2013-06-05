/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/* jshint curly:true, noempty:true, newcap:true, eqeqeq:true, eqnull:true, es5:true, undef:true, devel:true, browser:true, node:true, evil:false, latedef:false, nonew:true, trailing:false, immed:false, smarttabs:true, expr:true */
/* global describe, expect, it, before, beforeEach, after, afterEach */
/* global _, $, markdownRender, htmlToText, marked, hljs, Utils */


describe('Markdown-Render', function() {
  it('should exist', function() {
    expect(markdownRender).to.exist;
  });

  describe('convertHTMLtoMarkdown', function() {
    var convertHTMLtoMarkdown = markdownRender._testExports.convertHTMLtoMarkdown;

    it('should throw an exception for unsupported tags', function() {
      expect(_.partial(convertHTMLtoMarkdown, 'badtag')).to.throw(Error);
    });

    it('should not modify the string if there is no match', function() {
      var s = 'aaa <b>bbb</b> ccc <div>ddd</div> eee';
      expect(convertHTMLtoMarkdown('a', s)).to.equal(s);
    });

    it('should replace the given tag', function() {
      var s, target;

      s = 'aaa <b>bbb</b> ccc <div>ddd</div> eee <a href="fff">ggg</a> hhh';
      target = 'aaa <b>bbb</b> ccc <div>ddd</div> eee [ggg](fff) hhh';
      expect(convertHTMLtoMarkdown('a', s)).to.equal(target);

      s = 'aaa <b>bbb</b> ccc <div>ddd</div> eee <a href="fff">ggg</a> hhh <a href="iii">jjj <em>kkk</em></a> lll';
      target = 'aaa <b>bbb</b> ccc <div>ddd</div> eee [ggg](fff) hhh [jjj <em>kkk</em>](iii) lll';
      expect(convertHTMLtoMarkdown('a', s)).to.equal(target);
    });
  });

  describe('preprocessHtml', function() {
    var preprocessHtml = markdownRender._testExports.preprocessHtml;

    it ('should be okay with an empty string', function() {
      expect(preprocessHtml('', null).html).to.equal('');
    });
  });

  describe('markdownRender', function() {
    var userprefs = {};

    beforeEach(function() {
      userprefs = {
        'math-value': null,
        'math-enabled': false
      };
    });

    it('should be okay with an empty string', function() {
      expect(markdownRender(userprefs, htmlToText, marked, hljs, '', document, null)).to.equal('');
    });

    // Busted due to https://github.com/adam-p/markdown-here/issues/51, which
    // is busted due to https://github.com/chjj/marked/issues/56
    it('should NOT correctly handle links with URL text (busted due to issue #51)', function() {
      var s = '[http://example1.com](http://example2.com)';

      // Real target
      //var target = '<a href="http://example1.com>http://example2.com</a>';
      var target = '<a href="http://example1.com">http://example1.com</a>';
      expect(markdownRender(userprefs, htmlToText, marked, hljs, s, document, null)).to.contain(target);
    });

    it('should NOT quite correctly handle pre-formatted links with URL text (busted due to issue #51)', function() {
      var s = '<a href="http://example1.com">http://example2.com</a>';

      // Real target
      //var target = '<a href="http://example1.com>http://example2.com</a>';
      var target = '<a href="http://example1.com"><a href="http://example2.com">http://example2.com</a></a>';
      expect(markdownRender(userprefs, htmlToText, marked, hljs, s, document, null)).to.contain(target);
    });

    it('should retain pre-formatted links', function() {
      var s = '<a href="http://example1.com">aaa</a>';
      expect(markdownRender(userprefs, htmlToText, marked, hljs, s, document, null)).to.contain(s);
    });

    // Test that issue #69 hasn't come back: https://github.com/adam-p/markdown-here/issues/69
    it('should properly render MD links that have a pre-formatted URL as the URL portion', function() {
      var md = '[aaa](<a href="http://bbb">ccc</a>)';
      var html = '<p><a href="ccc">aaa</a></p>';

      var tests = [], i;

      // Begin tests where the link should be converted

      tests.push(['asdf <a href="http://www.aaa.com">bbb</a> asdf',
                  '<p>asdf <a href="http://www.aaa.com">bbb</a> asdf</p>\n']);

      tests.push(['<a href="aaa">bbb</a>',
                  '<p><a href="aaa">bbb</a></p>\n']);

      tests.push(['[xxx](yyy) <a href="aaa">bbb</a>',
                  '<p><a href="yyy">xxx</a> <a href="aaa">bbb</a></p>\n']);

      tests.push(['asdf (<a href="aaa">bbb</a>)',
                  '<p>asdf (<a href="aaa">bbb</a>)</p>\n']);

      // Begin tests where the link should *not* be converted

      tests.push(['asdf [yyy](<a href="http://www.aaa.com">bbb</a>) asdf',
                  '<p>asdf <a href="bbb">yyy</a> asdf</p>\n']);

      tests.push(['asdf [<a href="http://www.aaa.com">bbb</a>](ccc) asdf',
                  '<p>asdf <a href="ccc">bbb</a> asdf</p>\n']);

      tests.push(['[yyy](<a href="http://www.aaa.com">bbb</a>)',
                  '<p><a href="bbb">yyy</a></p>\n']);

      tests.push(['[yyy]( <a href="http://www.aaa.com">bbb</a>)',
                  '<p><a href="bbb">yyy</a></p>\n']);

      tests.push(['asdf [qwer <a href="http://www.aaa.com">bbb</a>](ccc) asdf',
                  '<p>asdf <a href="ccc">qwer bbb</a> asdf</p>\n']);

      // Begin tests that don't work quite right

      tests.push(['asdf [<a href="http://www.aaa.com">bbb</a>] asdf',
                  '<p>asdf [bbb] asdf</p>\n']);

      for (i = 0; i < tests.length; i++) {
        expect(markdownRender(userprefs, htmlToText, marked, hljs, tests[i][0], document, null)).to.equal(tests[i][1]);
      }
    });

  });

});
