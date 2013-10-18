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
});
