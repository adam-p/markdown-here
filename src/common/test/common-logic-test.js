/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/* jshint curly:true, noempty:true, newcap:true, eqeqeq:true, eqnull:true, es5:true, undef:true, devel:true, browser:true, node:true, evil:false, latedef:false, nonew:true, trailing:false, immed:false, smarttabs:true, expr:true */
/* global describe, expect, it, before, beforeEach, after, afterEach */
/* global _, $, markdownRender, htmlToText, marked, hljs, Utils, CommonLogic */


describe('CommonLogic', function() {
  it('should exist', function() {
    expect(CommonLogic).to.exist;
  });

  describe('getForgotToRenderPromptContent', function() {
    it('should get the forgot-to-render prompt', function(done) {
      var KNOWN_CONTENT = 'id="markdown-here-forgot-to-render"';
      var callback = function(data) {
        expect(data.indexOf(KNOWN_CONTENT)).to.be.greaterThan(-1);
        done();
      };

      CommonLogic.getForgotToRenderPromptContent(callback);
    });
  });


});