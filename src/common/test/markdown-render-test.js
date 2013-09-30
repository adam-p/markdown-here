/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/* jshint curly:true, noempty:true, newcap:true, eqeqeq:true, eqnull:true, undef:true, devel:true, browser:true, node:true, evil:false, latedef:false, nonew:true, trailing:false, immed:false, smarttabs:true, expr:true */
/* global describe, expect, it, before, beforeEach, after, afterEach */
/* global _, $, MarkdownRender, htmlToText, marked, hljs, Utils, MdhHtmlToText */


describe('Markdown-Render', function() {
  it('should exist', function() {
    expect(MarkdownRender).to.exist;
    expect(MarkdownRender.markdownRender).to.exist;
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
      expect(MarkdownRender.markdownRender('', userprefs, marked, hljs)).to.equal('');
    });

    // Busted due to https://github.com/adam-p/markdown-here/issues/51, which
    // is busted due to https://github.com/chjj/marked/issues/56
    it('should NOT correctly handle links with URL text (busted due to issue #51)', function() {
      var s = '[http://example1.com](http://example2.com)';

      // Real target
      //var target = '<a href="http://example1.com>http://example2.com</a>';
      var target = '<a href="http://example1.com">http://example1.com</a>';
      expect(MarkdownRender.markdownRender(s, userprefs, marked, hljs)).to.contain(target);
    });

    it('should NOT quite correctly handle pre-formatted links with URL text (busted due to issue #51)', function() {
      var s = '<a href="http://example1.com">http://example2.com</a>';

      // Real target
      //var target = '<a href="http://example1.com>http://example2.com</a>';
      var target = '<a href="http://example1.com"><a href="http://example2.com">http://example2.com</a></a>';
      expect(MarkdownRender.markdownRender(s, userprefs, marked, hljs)).to.contain(target);
    });

    it('should retain pre-formatted links', function() {
      var s = '<a href="http://example1.com">aaa</a>';
      expect(MarkdownRender.markdownRender(s, userprefs, marked, hljs)).to.contain(s);
    });

    // Test issue #57: https://github.com/adam-p/markdown-here/issues/57
    it('should add the schema to links missing it', function() {
      var md = 'asdf [aaa](bbb) asdf [ccc](ftp://ddd) asdf';
      var target = '<p>asdf <a href="http://bbb">aaa</a> asdf <a href="ftp://ddd">ccc</a> asdf</p>\n';
      expect(MarkdownRender.markdownRender(md, userprefs, marked, hljs)).to.equal(target);
    });

    it('should *not* add the schema to anchor links', function() {
      var md = 'asdf [aaa](#bbb) asdf [ccc](ftp://ddd) asdf';
      var target = '<p>asdf <a href="#bbb">aaa</a> asdf <a href="ftp://ddd">ccc</a> asdf</p>\n';
      expect(MarkdownRender.markdownRender(md, userprefs, marked, hljs)).to.equal(target);
    });

    // Test issue #87: https://github.com/adam-p/markdown-here/issues/87
    it('should smartypants apostrophes properly', function() {
      var md = "Adam's parents' place";
      var target = '<p>Adam\u2019s parents\u2019 place</p>\n';
      expect(MarkdownRender.markdownRender(md, userprefs, marked, hljs)).to.equal(target);
    });

    // Test issue #83: https://github.com/adam-p/markdown-here/issues/83
    it('should not alter MD-link-looking text in code blocks', function() {
      var md = '`[a](b)`';
      var target = '<p><code>[a](b)</code></p>\n';
      expect(MarkdownRender.markdownRender(md, userprefs, marked, hljs)).to.equal(target);

      md = '```\n[a](b)\n```';
      target = '<pre><code>[a](b)</code></pre>\n';
      expect(MarkdownRender.markdownRender(md, userprefs, marked, hljs)).to.equal(target);
    });

    // Test issue #84: Math: single-character formula won't render
    // https://github.com/adam-p/markdown-here/issues/84
    it('should render single-character math formulae', function() {
      userprefs = {
        'math-value': '<img src="https://chart.googleapis.com/chart?cht=tx&chl={urlmathcode}" alt="{mathcode}">',
        'math-enabled': true
      };

      var md = '$x$';
      var target = '<p><img src="https://chart.googleapis.com/chart?cht=tx&chl=x" alt="x"></p>\n';
      expect(MarkdownRender.markdownRender(md, userprefs, marked, hljs)).to.equal(target);

      // Make sure we haven't broken multi-character forumlae
      md = '$xx$';
      target = '<p><img src="https://chart.googleapis.com/chart?cht=tx&chl=xx" alt="xx"></p>\n';
      expect(MarkdownRender.markdownRender(md, userprefs, marked, hljs)).to.equal(target);
    });
  });


  describe('full render pipeline', function() {
    var userprefs = {};

    beforeEach(function() {
      userprefs = {
        'math-value': null,
        'math-enabled': false
      };
    });

    var fullRender = function(mdHTML) {
      var elem = $('<div>').html(mdHTML).appendTo('body');
      var mdhHtmlToText = new MdhHtmlToText.MdhHtmlToText(elem.get(0));
      var renderedMarkdown = MarkdownRender.markdownRender(
        mdhHtmlToText.get(), userprefs, marked, hljs);
      renderedMarkdown = mdhHtmlToText.postprocess(renderedMarkdown);
      $(elem).remove();
      return renderedMarkdown;
    };

    it('should be okay with an empty string', function() {
      expect(fullRender('')).to.equal('');
    });

    // Busted due to https://github.com/adam-p/markdown-here/issues/51, which
    // is busted due to https://github.com/chjj/marked/issues/56
    it('should NOT correctly handle links with URL text (busted due to issue #51)', function() {
      var s = '[http://example1.com](http://example2.com)';

      // Real target
      //var target = '<a href="http://example1.com>http://example2.com</a>';
      var target = '<a href="http://example1.com">http://example1.com</a>';
      expect(fullRender(s)).to.contain(target);
    });

    it('should NOT quite correctly handle pre-formatted links with URL text (busted due to issue #51)', function() {
      var s = '<a href="http://example1.com">http://example2.com</a>';

      // Real target
      //var target = '<a href="http://example1.com>http://example2.com</a>';
      var target = '<a href="http://example1.com"><a href="http://example2.com">http://example2.com</a></a>';
      expect(fullRender(s)).to.contain(target);
    });

    it('should retain pre-formatted links', function() {
      var s = '<a href="http://example1.com">aaa</a>';
      expect(fullRender(s)).to.contain(s);
    });

    // Test that issue #69 hasn't come back: https://github.com/adam-p/markdown-here/issues/69
    it('should properly render MD links that contain pre-formatted HTML links', function() {
      var tests = [], i;

      // NOTE: The expected results are affected by other content massaging,
      // such as adding missing links schemas.

      // Begin tests where the link should be converted

      tests.push(['asdf <a href="http://www.aaa.com">bbb</a> asdf',
                  '<p>asdf <a href="http://www.aaa.com">bbb</a> asdf</p>\n']);

      tests.push(['<a href="aaa">bbb</a>',
                  '<p><a href="http://aaa">bbb</a></p>\n']);

      tests.push(['[xxx](yyy) <a href="aaa">bbb</a>',
                  '<p><a href="http://yyy">xxx</a> <a href="http://aaa">bbb</a></p>\n']);

      tests.push(['asdf (<a href="aaa">bbb</a>)',
                  '<p>asdf (<a href="http://aaa">bbb</a>)</p>\n']);

      // Begin tests where the link should *not* be converted.
      // Note that some tests are affected by issue #57: MD links should automatically add scheme

      tests.push(['asdf [yyy](<a href="http://www.aaa.com">bbb</a>) asdf',
                  '<p>asdf <a href="http://bbb">yyy</a> asdf</p>\n']);

      tests.push(['asdf [<a href="http://www.aaa.com">bbb</a>](ccc) asdf',
                  '<p>asdf <a href="http://ccc">bbb</a> asdf</p>\n']);

      tests.push(['[yyy](<a href="http://www.aaa.com">bbb</a>)',
                  '<p><a href="http://bbb">yyy</a></p>\n']);

      tests.push(['[yyy]( <a href="http://www.aaa.com">bbb</a>)',
                  '<p><a href="http://bbb">yyy</a></p>\n']);

      tests.push(['asdf [qwer <a href="http://www.aaa.com">bbb</a>](ccc) asdf',
                  '<p>asdf <a href="http://ccc">qwer bbb</a> asdf</p>\n']);

      // Begin mixed tests

      tests.push(['asdf [aaa](bbb) asdf <a href="http://www.aaa.com">bbb</a> asdf [yyy](<a href="http://www.aaa.com">bbb</a>) asdf',
                  '<p>asdf <a href="http://bbb">aaa</a> asdf <a href="http://www.aaa.com">bbb</a> asdf <a href="http://bbb">yyy</a> asdf</p>\n']);

      // Begin tests that don't work quite right

      tests.push(['asdf [<a href="http://www.aaa.com">bbb</a>] asdf',
                  '<p>asdf [bbb] asdf</p>\n']);

      tests.push(['asdf ](<a href="http://www.aaa.com">bbb</a>) asdf',
                  '<p>asdf ](bbb) asdf</p>\n']);

      for (i = 0; i < tests.length; i++) {
        expect(fullRender(tests[i][0])).to.equal(tests[i][1]);
      }
    });

    // Test issue #57: https://github.com/adam-p/markdown-here/issues/57
    it('should add the schema to links missing it', function() {
      var md = 'asdf [aaa](bbb) asdf [ccc](ftp://ddd) asdf';
      var target = '<p>asdf <a href="http://bbb">aaa</a> asdf <a href="ftp://ddd">ccc</a> asdf</p>\n';
      expect(fullRender(md)).to.equal(target);
    });

    it('should *not* add the schema to anchor links', function() {
      var md = 'asdf [aaa](#bbb) asdf [ccc](ftp://ddd) asdf';
      var target = '<p>asdf <a href="#bbb">aaa</a> asdf <a href="ftp://ddd">ccc</a> asdf</p>\n';
      expect(fullRender(md)).to.equal(target);
    });

    // Test issue #87: https://github.com/adam-p/markdown-here/issues/87
    it('should smartypants apostrophes properly', function() {
      var md = "Adam's parents' place";
      var target = '<p>Adam\u2019s parents\u2019 place</p>\n';
      expect(fullRender(md)).to.equal(target);
    });

    // Test issue #83: https://github.com/adam-p/markdown-here/issues/83
    it('should not alter MD-link-looking text in code blocks', function() {
      var md = '`[a](b)`';
      var target = '<p><code>[a](b)</code></p>\n';
      expect(fullRender(md)).to.equal(target);

      md = '```<br>[a](b)<br>```';
      target = '<pre><code>[a](b)</code></pre>\n';
      expect(fullRender(md)).to.equal(target);
    });

    // Test issue #84: Math: single-character formula won't render
    // https://github.com/adam-p/markdown-here/issues/84
    it('should render single-character math formulae', function() {
      userprefs = {
        'math-value': '<img src="https://chart.googleapis.com/chart?cht=tx&chl={urlmathcode}" alt="{mathcode}">',
        'math-enabled': true
      };

      var md = '$x$';
      var target = '<p><img src="https://chart.googleapis.com/chart?cht=tx&chl=x" alt="x"></p>\n';
      expect(fullRender(md)).to.equal(target);

      // Make sure we haven't broken multi-character forumlae
      md = '$xx$';
      target = '<p><img src="https://chart.googleapis.com/chart?cht=tx&chl=xx" alt="xx"></p>\n';
      expect(fullRender(md)).to.equal(target);
    });

  });

});
