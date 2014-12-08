/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/* jshint curly:true, noempty:true, newcap:true, eqeqeq:true, eqnull:true, undef:true, devel:true, browser:true, node:true, evil:false, latedef:false, nonew:true, trailing:false, immed:false, smarttabs:true, expr:true */
/* global describe, expect, it, before, beforeEach, after, afterEach */
/* global _, $, MarkdownRender, htmlToText, marked, hljs, Utils, MdhHtmlToText */

// TODO: Test ranges.
// TODO: Lots more tests.

describe('MdhHtmlToText', function() {
  it('should exist', function() {
    expect(MdhHtmlToText).to.exist;
    expect(MdhHtmlToText.MdhHtmlToText).to.exist;
  });


  // Wraps the normal HTML-to-text calls
  var get = function(mdHTML) {
    var elem = $('<div>').html(mdHTML).appendTo('body');
    var mdhHtmlToText = new MdhHtmlToText.MdhHtmlToText(elem.get(0));
    var text = mdhHtmlToText.get();
    $(elem).remove();
    return text;
  };


  // Wraps the check-for-unrendered-MD HTML-to-text calls
  var check = function(mdHTML) {
    var elem = $('<div>').html(mdHTML).appendTo('body');
    var mdhHtmlToText = new MdhHtmlToText.MdhHtmlToText(elem.get(0), null, true);
    var text = mdhHtmlToText.get();
    $(elem).remove();
    return text;
  };


  describe('MdhHtmlToText (normal mode)', function() {
    it('should be okay with an empty string', function() {
      expect(get('')).to.equal('');
    });

    // Busted due to https://github.com/adam-p/markdown-here/issues/104
    it('should NOT correctly handle pre-rendered links in inline code (busted due to issue #104)', function() {
      var html = 'aaa `<a href="bbb">ccc</a>`';

      // Real target
      // var target = 'aaa `bbb`';
      var target = 'aaa `[ccc](bbb)`';
      expect(get(html)).to.equal(target);
    });

    // Busted due to https://github.com/adam-p/markdown-here/issues/104
    it('should NOT correctly handle pre-rendered links in code blocks (busted due to issue #104)', function() {
      var html = '```<br><a href="aaa">bbb</a><br>```';

      // Real target
      // var target = '```\nbbb\n```';
      var target = '```\n[bbb](aaa)\n```';
      expect(get(html)).to.equal(target);
    });

    // Test fix for bug https://github.com/adam-p/markdown-here/pull/233
    // reflinks and nolinks weren't working with pre-rendered links.
    it('should work correctly with pre-rendered links in reflinks and nolinks', function() {
      //
      // reflinks
      //

      var html = '[link text][1]<br>[1]: <a href="http://example.com">http://example.com</a><br>';
      var target = '[link text][1]\n[1]: http://example.com';
      expect(get(html)).to.equal(target);

      // HTTPS and a target attribute
      html = '[link text][1]<br>[1]: <a href="https://example.com" target="_blank">https://example.com</a><br>';
      target = '[link text][1]\n[1]: https://example.com';
      expect(get(html)).to.equal(target);

      // Different URL for HREF and text of link (should use text of link)
      html = '[link text][1]<br>[1]: <a href="http://hreflink.com">https://textlink.com</a><br>';
      target = '[link text][1]\n[1]: https://textlink.com';
      expect(get(html)).to.equal(target);

      // Only the hostname part of the URL is a link
      html = '[link text][1]<br>[1]: http://<a href="http://example.com">example.com</a><br>';
      target = '[link text][1]\n[1]: http://example.com';
      expect(get(html)).to.equal(target);

      //
      // nolinks
      //

      html = '[link text]<br>[link text]: <a href="http://example.com">http://example.com</a><br>';
      target = '[link text]\n[link text]: http://example.com';
      expect(get(html)).to.equal(target);

      // HTTPS and a target attribute
      html = '[link text]<br>[link text]: <a href="https://example.com" target="_blank">https://example.com</a><br>';
      target = '[link text]\n[link text]: https://example.com';
      expect(get(html)).to.equal(target);

      // Different URL for HREF and text of link (should use text of link)
      html = '[link text]<br>[link text]: <a href="http://hreflink.com">https://textlink.com</a><br>';
      target = '[link text]\n[link text]: https://textlink.com';
      expect(get(html)).to.equal(target);

      // Only the hostname part of the URL is a link
      html = '[link text]<br>[link text]: http://<a href="http://example.com">example.com</a><br>';
      target = '[link text]\n[link text]: http://example.com';
      expect(get(html)).to.equal(target);
    });

  });

  describe('MdhHtmlToText (check-for-MD mode)', function() {
    it('should be okay with an empty string', function() {
      expect(check('')).to.equal('');
    });

    it('should not choke on links', function() {
      // Links get de-rendered to MD normally, but not when checking
      var html = '<a href="http://markdown-here.com">MDH</a>';
      var target = 'MDH';
      expect(check(html)).to.equal(target);
    });

    // Check for fix to https://github.com/adam-p/markdown-here/issues/128
    it('should exclude the content of <code> elements', function() {
      // Because otherwise unrendered MD in code would get falsely detected.
      var html = 'Foo<code style="blah">inline code</code>Bar<pre style="blah"><code style="blah">code block</code></pre>Okay';
      var target = 'FooBar\n\nOkay';
      expect(check(html)).to.equal(target);
    });

  });

});
