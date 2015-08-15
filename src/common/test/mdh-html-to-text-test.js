/*
 * Copyright Adam Pritchard 2015
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

    // Fix for https://github.com/adam-p/markdown-here/issues/104
    it('should correctly handle pre-rendered links in inline code (fix for issue #104)', function() {
      var html = 'aaa `<a href="bbb">ccc</a>`';

      // Real target
      var target = 'aaa `ccc`';
      expect(get(html)).to.equal(target);
    });

    // Fix for https://github.com/adam-p/markdown-here/issues/104
    it('should correctly handle pre-rendered links in code blocks (fix for issue #104)', function() {
      var html = '```<br><a href="aaa">bbb</a><br>```';

      // Real target
      var target = '```\nbbb\n```';
      expect(get(html)).to.equal(target);
    });

    // Busted due to https://github.com/adam-p/markdown-here/issues/104
    it('should NOT correctly handle pre-rendered links in code blocks (busted due to issue #104)', function() {
      var html = '&nbsp;&nbsp;&nbsp;&nbsp;<a href="aaa">bbb</a><br>';

      // Real target
      // var target = '    bbb';
      var target = '    [bbb](aaa)';
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

    // Test fix for bug https://github.com/adam-p/markdown-here/issues/251
    // <br> at the end of <div> should not add a newline
    it('should not add an extra newline for br at end of div', function() {
      // HTML from issue
      var html = '<div><div>mardown | test<br>-- |---<br></div>1 |\ntest<br></div>2 | test2<br clear="all">';
      var target = 'mardown | test\n-- |---\n1 | test\n2 | test2';
      expect(get(html)).to.equal(target);
    });

    // Test some cases with bare text nodes
    it('should properly handle bare text nodes', function() {
      var html = '';
      var target = '';
      expect(get(html)).to.equal(target);

      html = 'asdf';
      target = 'asdf';
      expect(get(html)).to.equal(target);

      html = 'asdf<div class="x">qwer</div>';
      target = 'asdf\nqwer';
      expect(get(html)).to.equal(target);

      html = 'asdf<br class="x">qwer';
      target = 'asdf\nqwer';
      expect(get(html)).to.equal(target);

      html = 'asdf<br class="x">qwer<div>zxcv</div>asdf';
      target = 'asdf\nqwer\nzxcv\nasdf';
      expect(get(html)).to.equal(target);

      html = 'asdf<br class="x">qwer<div>zxcv</div>ghjk<div>yuio</div>asdf';
      target = 'asdf\nqwer\nzxcv\nghjk\nyuio\nasdf';
      expect(get(html)).to.equal(target);

      html = 'asdf<br class="x">qwer<div><div>zxcv</div>ghjk<div>yuio</div></div>asdf';
      target = 'asdf\nqwer\nzxcv\nghjk\nyuio\nasdf';
      expect(get(html)).to.equal(target);

      html = 'asdf\n<br class="x">qwer<div><div>zxcv</div>ghjk<div>yuio</div></div>asdf';
      target = 'asdf \nqwer\nzxcv\nghjk\nyuio\nasdf';
      expect(get(html)).to.equal(target);

      html = '<div class="x">asdf</div>qwer';
      target = 'asdf\nqwer';
      expect(get(html)).to.equal(target);
    });

    // Test the fix for bug https://github.com/adam-p/markdown-here/issues/288
    // Use of dollar sign in inline code producing odd results
    it('should properly handle a dollar sign in inline code', function() {
      var html = '`$`';
      var target = '`$`';
      expect(get(html)).to.equal(target);
    });

    // Test the fix for bug https://github.com/adam-p/markdown-here/issues/289
    // Large HTML input caused bad slowness and hangs
    it('should not hang on big HTML input', function() {
      var html = BIG_BAD_STRING;

      // The times here were chosen pretty unscientifically, and will stop
      // ensuring failure as processors get faster. (And may fail incorrectly
      // on a slow machine.)

      // Test a no-match for the was-known-to-be-bad regex
      var start = new Date();
      get(html);
      var end = new Date();
      expect(end.getTime() - start.getTime()).to.be.below(1000);

      // Test a match for the was-known-to-be-bad regex
      html += 'x';
      start = new Date();
      get(html);
      end = new Date();
      expect(end.getTime() - start.getTime()).to.be.below(1000);
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

var BIG_BAD_STRING = '<div><pre style="font-size:0.85em;font-family:Consolas,Inconsolata,Courier,monospace;font-size:1em;line-height:1.2em;margin:1.2em 0px"><code style="font-size:0.85em;font-family:Consolas,Inconsolata,Courier,monospace;margin:0px 0.15em;padding:0px 0.3em;white-space:pre-wrap;border:1px solid rgb(234,234,234);border-radius:3px;display:inline;background-color:rgb(248,248,248);white-space:pre-wrap;overflow:auto;border-radius:3px;border:1px solid rgb(204,204,204);padding:0.5em 0.7em;display:block!important;display:block;overflow-x:auto;padding:0.5em;color:rgb(51,51,51);background:rgb(248,248,248)"><span><span style="color:rgb(51,51,51);font-weight:bold">function</span> <span style="color:rgb(153,0,0);font-weight:bold">syntaxHighlighting</span><span>()</span> </span>{\n  <span style="color:rgb(51,51,51);font-weight:bold">var</span> n = <span style="color:rgb(0,128,128)">33</span>;\n  <span style="color:rgb(51,51,51);font-weight:bold">var</span> s = <span style="color:rgb(221,17,68)">"hello, こんにちは"</span>;\n  <span style="color:rgb(0,134,179)">console</span>.log(s);\n}\n</code></pre>\n<ul style="margin:1.2em 0px;padding-lfet:2em">\n<li style="margin:0.5em 0px">plain</li>\n<li style="margin:0.5em 0px"><em>emphasis</em><ul style="margin:1.2em 0px;padding-left:2em;margin:0px;padding-left:1em">\n<li style="margin:0.5em 0px"><strong>strong emphasis</strong><ul style="margin:1.2em 0px;padding-left:2em;margin:0px;padding-left:1em">\n<li style="margin:0.5em 0px"><del>strikethrough</del></li>\n</ul>\n</li>\n</ul>\n</li>\n<li style="margin:0.5em 0px"><code style="font-size:0.85em;font-family:Consolas,Inconsolata,Courier,monospace;margin:0px 0.15em;padding:0px 0.3em;white-space:pre-wrap;border:1px solid rgb(234,234,234);border-radius:3px;display:inline;background-color:rgb(248,248,248)">inline code</code></li>\n</ul>\n<ol style="margin:1.2em 0px;padding-left:2em">\n<li style="margin:0.5em 0px">Numbered list<ol style="margin:1.2em 0px;padding-left:2em;margin:0px;padding-left:1em;list-style-type:lower-roman">\n<li style="margin:0.5em 0px">Numbered sub-list<ol style="margin:1.2em 0px;padding-left:2em;margin:0px;padding-left:1em;list-style-type:lower-roman;list-style-type:lower-alpha">\n<li style="margin:0.5em 0px">Numbered sub-sub-list</li>\n</ol>\n</li>\n</ol>\n</li>\n<li style="margin:0.5em 0px"><a href="https://www.google.com" target="_blank">Link</a></li>\n</ol>\n<p style="margin:0px 0px 1.2em!important">An image: <img src="https://ci6.googleusercontent.com/proxy/SnqZGOlvv1rmqrH0D3Hv3b_xgSYDF1X85eF5yiLlq7JA460-RO1EUXU3m6je9Clj3CIVzrbcfE0mNObMdllDlTyOUEWMXBY7pgk=s0-d-e1-ft#http://adam-p.github.io/markdown-here/img/icon24.png" alt="Markdown Here logo" class="CToWUd"> </p>\n<blockquote style="margin:1.2em 0px;border-left-width:4px;border-left-style:solid;border-left-color:rgb(221,221,221);padding:0px 1em;color:rgb(119,119,119);quotes:none">\n<p style="margin:0px 0px 1.2em!important">Block quote.<br><em>With</em> <strong>some</strong> <code style="font-size:0.85em;font-family:Consolas,Inconsolata,Courier,monospace;margin:0px 0.15em;padding:0px 0.3em;white-space:pre-wrap;border:1px solid rgb(234,234,234);border-radius:3px;display:inline;background-color:rgb(248,248,248)">markdown</code>.</p>\n</blockquote>\n<p style="margin:0px 0px 1.2em!important">If <strong>TeX Math</strong> support is enabled, this is the quadratic equation:<br><img src="https://ci6.googleusercontent.com/proxy/Sp3KOkAUXBpjcStpC8T3Jdqb7b8SSr1BfD2cAfBIfujneu6qK8KOq5ul5JDzCWrvUGbkcbMErHPvZbekk91jruwtGojKwnXRMwbpWqaW9XNn9YUjdl64c4P9yBIPU2uc-YfaDe8MxJDAPqX-pQVv7ycg1CELz3RzsHN-Uw=s0-d-e1-ft#https://chart.googleapis.com/chart?cht=tx&amp;chl=-b%20%5Cpm%20%5Csqrt%7Bb%5E2%20-%204ac%7D%20%5Cover%202a" alt="-b \\pm \\sqrt{b^2 - 4ac} \\over 2a" class="CToWUd"></p>\n<h1 style="margin:1.3em 0px 1em;padding:0px;font-weight:bold;font-size:1.6em;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(221,221,221)"><a href="#14f1a36fb61d8846_" name="14f1a36fb61d8846_header-1"></a>Header 1</h1>\n<h2 style="margin:1.3em 0px 1em;padding:0px;font-weight:bold;font-size:1.4em;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(238,238,238)"><a href="#14f1a36fb61d8846_" name="14f1a36fb61d8846_header-2"></a>Header 2</h2>\n<h3 style="margin:1.3em 0px 1em;padding:0px;font-weight:bold;font-size:1.3em"><a href="#14f1a36fb61d8846_" name="14f1a36fb61d8846_header-3"></a>Header 3</h3>\n<h4 style="margin:1.3em 0px 1em;padding:0px;font-weight:bold;font-size:1.2em"><a href="#14f1a36fb61d8846_" name="14f1a36fb61d8846_header-4"></a>Header 4</h4>\n<h5 style="margin:1.3em 0px 1em;padding:0px;font-weight:bold;font-size:1em"><a href="#14f1a36fb61d8846_" name="14f1a36fb61d8846_header-5"></a>Header 5</h5>\n<h6 style="margin:1.3em 0px 1em;padding:0px;font-weight:bold;font-size:1em;color:rgb(119,119,119)"><a href="#14f1a36fb61d8846_" name="14f1a36fb61d8846_header-6"></a>Header 6</h6>\n<table style="margin:1.2em 0px;padding:0px;border-collapse:collapse;border-spacing:0px;font-family:inherit;font-size:inherit;font-style:inherit;font-variant:inherit;font-weight:inherit;font-stretch:inherit;line-height:inherit;border:0px">\n<thead>\n<tr style="border-width:1px 0px 0px;border-top-style:solid;border-top-color:rgb(204,204,204);margin:0px;padding:0px;background-color:white">\n<th style="font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em;font-weight:bold;background-color:rgb(240,240,240)">Tables</th>\n<th style="text-align:center;font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em;font-weight:bold;background-color:rgb(240,240,240)">Are</th>\n<th style="text-align:right;font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em;font-weight:bold;background-color:rgb(240,240,240)">Cool</th>\n</tr>\n</thead>\n<tbody style="margin:0px;padding:0px;border:0px">\n<tr style="border-width:1px 0px 0px;border-top-style:solid;border-top-color:rgb(204,204,204);margin:0px;padding:0px;background-color:white">\n<td style="font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em">column 3 is</td>\n<td style="text-align:center;font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em">right-aligned</td>\n<td style="text-align:right;font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em">$1600</td>\n</tr>\n<tr style="border-width:1px 0px 0px;border-top-style:solid;border-top-color:rgb(204,204,204);margin:0px;padding:0px;background-color:white;background-color:rgb(248,248,248)">\n<td style="font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em">column 2 is</td>\n<td style="text-align:center;font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em">centered</td>\n<td style="text-align:right;font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em">$12</td>\n</tr>\n<tr style="border-width:1px 0px 0px;border-top-style:solid;border-top-color:rgb(204,204,204);margin:0px;padding:0px;background-color:white">\n<td style="font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em">zebra stripes</td>\n<td style="text-align:center;font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em">are neat</td>\n<td style="text-align:right;font-size:1em;border:1px solid rgb(204,204,204);margin:0px;padding:0.5em 1em">$1</td>\n</tr>\n</tbody>\n</table>\n<p style="margin:0px 0px 1.2em!important">Here’s a horizontal rule:</p>\n<hr>\n<pre style="font-size:0.85em;font-family:Consolas,Inconsolata,Courier,monospace;font-size:1em;line-height:1.2em;margin:1.2em 0px"><code style="font-size:0.85em;font-family:Consolas,Inconsolata,Courier,monospace;margin:0px 0.15em;padding:0px 0.3em;white-space:pre-wrap;border:1px solid rgb(234,234,234);border-radius:3px;display:inline;background-color:rgb(248,248,248);white-space:pre-wrap;overflow:auto;border-radius:3px;border:1px solid rgb(204,204,204);padding:0.5em 0.7em;display:block!important">code block\nwith no highlighting\n</code></pre><div title="MDH:PGRpdj5gYGBqYXZhc2NyaXB0PC9kaXY+PGRpdj5mdW5jdGlvbiBzeW50YXhIaWdobGlnaHRpbmco\nKSB7PC9kaXY+PGRpdj4mbmJzcDsgdmFyIG4gPSAzMzs8L2Rpdj48ZGl2PiZuYnNwOyB2YXIgcyA9\nICJoZWxsbywg44GT44KT44Gr44Gh44GvIjs8L2Rpdj48ZGl2PiZuYnNwOyBjb25zb2xlLmxvZyhz\nKTs8L2Rpdj48ZGl2Pn08L2Rpdj48ZGl2PmBgYDwvZGl2PjxkaXY+PGJyPjwvZGl2PjxkaXY+KiBw\nbGFpbjwvZGl2PjxkaXY+KiAqZW1waGFzaXMqPC9kaXY+PGRpdj4mbmJzcDsgKiAqKnN0cm9uZyBl\nbXBoYXNpcyoqPC9kaXY+PGRpdj4mbmJzcDsgJm5ic3A7ICogfn5zdHJpa2V0aHJvdWdofn48L2Rp\ndj48ZGl2PiogYGlubGluZSBjb2RlYDwvZGl2PjxkaXY+PGJyPjwvZGl2PjxkaXY+MS4gTnVtYmVy\nZWQgbGlzdDwvZGl2PjxkaXY+Jm5ic3A7ICZuYnNwOzEuIE51bWJlcmVkIHN1Yi1saXN0PC9kaXY+\nPGRpdj4mbmJzcDsgJm5ic3A7ICZuYnNwOyAxLiBOdW1iZXJlZCBzdWItc3ViLWxpc3Q8L2Rpdj48\nZGl2PjIuIFtMaW5rXShodHRwczovL3d3dy5nb29nbGUuY29tKTwvZGl2PjxkaXY+PGJyPjwvZGl2\nPjxkaXY+PGJyPjwvZGl2PjxkaXY+QW4gaW1hZ2U6ICFbTWFya2Rvd24gSGVyZSBsb2dvXShodHRw\nOi8vYWRhbS1wLmdpdGh1Yi5pby9tYXJrZG93bi1oZXJlL2ltZy9pY29uMjQucG5nKSZuYnNwOzwv\nZGl2PjxkaXY+PGJyPjwvZGl2PjxkaXY+Jmd0OyBCbG9jayBxdW90ZS4gJm5ic3A7PC9kaXY+PGRp\ndj4mZ3Q7ICpXaXRoKiAqKnNvbWUqKiBgbWFya2Rvd25gLjwvZGl2PjxkaXY+PGJyPjwvZGl2Pjxk\naXY+SWYgKipUZVggTWF0aCoqIHN1cHBvcnQgaXMgZW5hYmxlZCwgdGhpcyBpcyB0aGUgcXVhZHJh\ndGljIGVxdWF0aW9uOiZuYnNwOzwvZGl2PjxkaXY+JC1iIFxwbSBcc3FydHtiXjIgLSA0YWN9IFxv\ndmVyIDJhJDwvZGl2PjxkaXY+PGJyPjwvZGl2PjxkaXY+IyBIZWFkZXIgMTwvZGl2PjxkaXY+IyMg\nSGVhZGVyIDI8L2Rpdj48ZGl2PiMjIyBIZWFkZXIgMzwvZGl2PjxkaXY+IyMjIyBIZWFkZXIgNDwv\nZGl2PjxkaXY+IyMjIyMgSGVhZGVyIDU8L2Rpdj48ZGl2PiMjIyMjIyBIZWFkZXIgNjwvZGl2Pjxk\naXY+Jm5ic3A7Jm5ic3A7PC9kaXY+PGRpdj58IFRhYmxlcyB8IEFyZSB8IENvb2wgfDwvZGl2Pjxk\naXY+fCAtLS0tLS0tLS0tLS0tIHw6LS0tLS0tLS0tLS0tLTp8IC0tLS0tOnw8L2Rpdj48ZGl2Pnwg\nY29sdW1uIDMgaXMgfCByaWdodC1hbGlnbmVkIHwgJDE2MDAgfDwvZGl2PjxkaXY+fCBjb2x1bW4g\nMiBpcyB8IGNlbnRlcmVkIHwgJDEyIHw8L2Rpdj48ZGl2PnwgemVicmEgc3RyaXBlcyB8IGFyZSBu\nZWF0IHwgJDEgfDwvZGl2PjxkaXY+PGJyPjwvZGl2PjxkaXY+SGVyZSdzIGEgaG9yaXpvbnRhbCBy\ndWxlOjwvZGl2PjxkaXY+PGJyPjwvZGl2PjxkaXY+LS0tPC9kaXY+PGRpdj48YnI+PC9kaXY+PGRp\ndj5gYGA8L2Rpdj48ZGl2PmNvZGUgYmxvY2s8L2Rpdj48ZGl2PndpdGggbm8gaGlnaGxpZ2h0aW5n\nPC9kaXY+PGRpdj5gYGA8L2Rpdj48ZGl2Pjxicj48L2Rpdj4=" style="min-height:0;width:0;max-height:0;max-width:0;overflow:hidden;font-size:0em;padding:0;margin:0"></div></div>'
  .repeat(100);
