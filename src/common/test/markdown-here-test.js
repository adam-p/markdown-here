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

  /*
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

    var render = function(mdHTML, renderCompleteCallback) {
      $testElem.html(mdHTML);
      $testElem.focus();
      markdownHere(
        document,
        markdownRenderHelper,
        function() { console.log.apply(console, arguments); },
        renderCompleteCallback);
    };

    // If there's no error, done has to be called with no argument.
    var doneCaller = function(expectedInnerHtml, done) {
      return function(elem) {
        MORE COMPLEX THAN THIS: Wrapper elem has data-md-url and data-md-original
        expect(elem.innerHTML).to.equal(expectedInnerHtml);
        done();
      };
    };

    it('should render simple MD', function(done) {
      render('_hi_', doneCaller(done));
    });
  });
  */
});
