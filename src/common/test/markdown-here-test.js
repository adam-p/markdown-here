/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/* jshint curly:true, noempty:true, newcap:true, eqeqeq:true, eqnull:true, undef:true, devel:true, browser:true, node:true, evil:false, latedef:false, nonew:true, trailing:false, immed:false, smarttabs:true, expr:true */
/* global describe, expect, it, before, beforeEach, after, afterEach */
/* global _, $, MarkdownRender, htmlToText, marked, hljs, Utils, MdhHtmlToText, markdownHere */

// TODO: Lots more tests.

describe('markdownHere', function() {
  it('should exist', function() {
    expect(markdownHere).to.exist;
  });

  it('platform supports MutationObserver', function() {
    expect(window.MutationObserver || window.WebKitMutationObserver).to.be.ok;
  });

  describe('markdownHere', function() {
    var userprefs = {};
    var $testElem = null;

    beforeEach(function() {
      userprefs = {
        'math-value': null,
        'math-enabled': false,
        'main-css': '',
        'syntax-css': ''
      };

      $testElem = $('<div contentEditable="true">').appendTo('body');
    });

    afterEach(function() {
      $testElem.remove();
    });

    var markdownRenderHelper = function(elem, range, callback) {
      var mdhHtmlToText = new MdhHtmlToText.MdhHtmlToText(elem, range);
      var renderedMarkdown = MarkdownRender.markdownRender(
        mdhHtmlToText.get(), userprefs, marked, hljs);
      renderedMarkdown = mdhHtmlToText.postprocess(renderedMarkdown);

      callback(renderedMarkdown, userprefs['main-css'] + userprefs['syntax-css']);
    };

    var renderMD = function(mdHTML, renderCompleteCallback) {
      $testElem.html(mdHTML);
      $testElem.focus();
      renderFocusedElem(renderCompleteCallback);
    };

    var renderFocusedElem = function(renderCompleteCallback) {
      markdownHere(
        document,
        markdownRenderHelper,
        function() { console.log.apply(console, arguments); },
        renderCompleteCallback);
    };

    // If there's no error, done has to be called with no argument.
    var doneCaller = function(expectedInnerHtml, done) {
      expectedInnerHtml = expectedInnerHtml.trim();
      return function(elem) {
        var renderedHTMLRegex = /^<div class="markdown-here-wrapper" data-md-url="[^"]+">([\s\S]*)<div title="MDH:[\s\S]+">[\s\S]*<\/div><\/div>$/;
        var renderedHTML = elem.innerHTML.match(renderedHTMLRegex)[1];
        renderedHTML = renderedHTML.trim();
        expect(renderedHTML).to.equal(expectedInnerHtml);
        done();
      };
    };

    it('should render simple MD', function(done) {
      var md = '_hi_';
      var html = '<p><em>hi</em></p>';
      renderMD(md, doneCaller(html, done));
    });

    it('should unrender simple MD', function(done) {
      var md = '_hi_';

      // First render
      renderMD(md, function(elem) {
        // Then unrender
        $testElem.focus();
        renderFocusedElem(
          function(elem) {
            expect(elem.innerHTML).to.equal(md);
            done();
          });
      });
    });

    // Tests fix for https://github.com/adam-p/markdown-here/issues/297
    // Attempting to unrender an email that was a reply to an email that was
    // itself MDH-rendered failed.
    it('should unrender a reply to a rendered email', function(done) {
      var replyMD = '_bye_';
      var fullReplyMD = replyMD+'<br><div class="gmail_quote">On Fri, Aug 14, 2015 at 10:34 PM, Billy Bob <span dir="ltr">&lt;<a href="mailto:bb@example.com" target="_blank">bb@example.com</a>&gt;</span> wrote:<br><blockquote><div class="markdown-here-wrapper" data-md-url="xxx"><p><em>hi</em></p>\n<div title="MDH:X2hpXw==" style="height:0;width:0;max-height:0;max-width:0;overflow:hidden;font-size:0em;padding:0;margin:0;">​</div></div></blockquote></div>';
      // First render
      renderMD(fullReplyMD, function(elem) {
        // Then unrender
        $testElem.focus();
        renderFocusedElem(
          function(elem) {
            expect(elem.innerHTML.slice(0, replyMD.length)).to.equal(replyMD);
            done();
          });
      });
    });

  });
});
