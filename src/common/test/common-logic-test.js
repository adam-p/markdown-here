/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/* jshint curly:true, noempty:true, newcap:true, eqeqeq:true, eqnull:true, undef:true, devel:true, browser:true, node:true, evil:false, latedef:false, nonew:true, trailing:false, immed:false, smarttabs:true, expr:true */
/* global describe, expect, it, before, beforeEach, after, afterEach */
/* global _, $, markdownRender, htmlToText, marked, hljs, Utils, CommonLogic */


describe('CommonLogic', function() {
  it('should exist', function() {
    expect(CommonLogic).to.exist;
  });

  describe('getUpgradeNotification', function() {
    it('should get the upgrade notification', function(done) {
      var KNOWN_CONTENT = 'id="markdown-here-upgrade-notification-content"';
      var TEST_OPTIONS_URL = 'my-test-options-url';
      var callback = function(data) {
        expect(data.indexOf(KNOWN_CONTENT)).to.be.greaterThan(-1);
        expect(data.indexOf(TEST_OPTIONS_URL)).to.be.greaterThan(-1);
        done();
      };

      CommonLogic.getUpgradeNotification(TEST_OPTIONS_URL, callback);
    });
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

  describe('probablyWritingMarkdown', function() {
    var prefs = {};

    it('should not detect an empty string', function() {
      expect(CommonLogic.probablyWritingMarkdown('', marked, prefs)).to.equal(false);
    });

    it('should not detect non-MD text', function() {
      var text = 'Hi friend,\n\nHow are you?\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(false);
    });

    it('should detect bullets', function() {
      var text = 'Hi friend,\n\nHow are you?\n\n* bullet 1\n  * sub-bullet\n* bullet 2\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);
    });

    it('should detect code', function() {
      var text = 'Hi friend,\n\nHow are you?\n\nHere is `code`.\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);

      text = 'Hi friend,\n\nHow are you?\n\n```javascript\nvar s = "code";\n```\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);
    });

    it('should detect math', function() {
      var text = 'Hi friend,\n\nHow are you?\n\n$\\delta$\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);
    });

    it('should detect emphasis', function() {
      var text = 'Hi friend,\n\nHow are you?\n\nSo **strong**!\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);

      // But not light emphasis.
      text = 'Hi friend,\n\nHow are you?\n\nSo _weak_!\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(false);
    });

    it('should detect headers', function() {
      var text = 'Hi friend,\n\nHow are you?\n\n## IMAHEADER\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);

      text = 'Hi friend,\n\nHow are you?\n\n###### IMAHEADER\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);

      text = 'Hi friend,\n\nHow are you?\n\n  ## SPACES BEFORE HASHES AND AFTER TEXT  \n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);

      text = 'Hi friend,\n\nHow are you?\n\n####### TOO MANY HASH MARKS\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(false);

      text = 'Hi friend,\n\nHow are you?\n\nUNDERLINE HEADER\n------\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);

      text = 'Hi friend,\n\nHow are you?\n\nUNDERLINE HEADER\n======\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);

      text = 'Hi friend,\n\nHow are you?\n\nSPACES BEFORE DASHES OKAY\n  ======\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);

      text = 'Hi friend,\n\nHow are you?\n\n===== TEXT AFTER UNDERLINE\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(false);
    });

    it('should detect links', function() {
      var text = 'Hi friend,\n\nHow are you?\n\n[The Goog](https://www.google.com)\n\nsincerely,\nme';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);

      text = 'Hi friend,\n\nHow are you?\n\n[The Goog][1]\n\nsincerely,\nme\n\n[1]: https://www.google.com';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(true);

      text = 'Hi friend,\n\nHow are you?\n\n[Not a nolink link].\n\nsincerely,\nme\n\n';
      expect(CommonLogic.probablyWritingMarkdown(text, marked, prefs)).to.equal(false);
    });

  });

});
