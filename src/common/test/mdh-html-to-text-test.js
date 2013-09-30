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

  var get = function(mdHTML) {
    var elem = $('<div>').html(mdHTML).appendTo('body');
    var mdhHtmlToText = new MdhHtmlToText.MdhHtmlToText(elem.get(0));
    var text = mdhHtmlToText.get();
    $(elem).remove();
    return text;
  };


  describe('MdhHtmlToText', function() {
    it('should be okay with an empty string', function() {
      expect(get('')).to.equal('');
    });

  });

});
