/*
 * Copyright Adam Pritchard 2014
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/* jshint curly:true, noempty:true, newcap:true, eqeqeq:true, eqnull:true, es5:true, undef:true, devel:true, browser:true, node:true, evil:false, latedef:false, nonew:true, trailing:false, immed:false, smarttabs:true, expr:true */
/* global describe, expect, it, before, beforeEach, after, afterEach */
/* global _, $, markdownRender, htmlToText, marked, hljs, Utils */


// This function wraps `htmlString` in a `<div>` to make life easier for us.
// It should affect the testing behaviour, though -- good/bad elements in a
// `<div>` are still good/bad.
function createDocFrag(htmlString) {
  var docFrag = document.createDocumentFragment();
  var elem = document.createElement('div');
  elem.innerHTML = htmlString;
  docFrag.appendChild(elem);
  return docFrag;
}


describe('Utils', function() {
  it('should exist', function() {
    expect(Utils).to.exist;
  });

  describe('sanitizeDocumentFragment', function() {
    it('should not alter safe doc-frags', function() {
      var origFrag = createDocFrag('<div>hi');
      var sanFrag = Utils.sanitizeDocumentFragment(origFrag);
      expect(origFrag.isEqualNode(sanFrag)).to.be.true;
    });

    it('should remove <script> elements', function() {
      var origFrag = createDocFrag('<b>hi</b><script>alert("oops")</script>there<script>alert("derp")</script>');
      var sanFrag = Utils.sanitizeDocumentFragment(origFrag);
      expect(origFrag.isEqualNode(sanFrag)).to.be.false;

      var cleanFrag = createDocFrag('<b>hi</b>there');
      expect(cleanFrag.isEqualNode(sanFrag)).to.be.true;
    });

    it('should not remove safe attributes', function() {
      var origFrag = createDocFrag('<div id="rad" style="color:red">hi</div>');
      // Make sure the attributes are sticking in the original
      expect(origFrag.querySelector('#rad').style.color).to.equal('red');

      var sanFrag = Utils.sanitizeDocumentFragment(origFrag);
      expect(origFrag.isEqualNode(sanFrag)).to.be.true;
    });

    it('should remove event handler attributes', function() {
      var origFrag = createDocFrag('<div id="rad" style="color:red" onclick="javascript:alert(\'derp\')">hi</div>');
      // Make sure the attributes are sticking in the original
      expect(origFrag.querySelector('#rad').attributes.onclick).to.exist;

      var sanFrag = Utils.sanitizeDocumentFragment(origFrag);
      expect(origFrag.isEqualNode(sanFrag)).to.be.false;

      var cleanFrag = createDocFrag('<div id="rad" style="color:red">hi</div>');
      expect(cleanFrag.isEqualNode(sanFrag)).to.be.true;
    });
  });

  describe('saferSetInnerHTML', function() {
    it('should set safe HTML without alteration', function() {
      var testElem = document.createElement('div');
      Utils.saferSetInnerHTML(testElem, '<p>hi</p>');

      var checkElem = document.createElement('div');
      checkElem.innerHTML = '<p>hi</p>';

      expect(testElem.isEqualNode(checkElem)).to.be.true;
    });

    it('should remove <script> elements', function() {
      var testElem = document.createElement('div');
      Utils.saferSetInnerHTML(testElem, '<b>hi</b><script>alert("oops")</script>there<script>alert("derp")</script>');

      var checkElem = document.createElement('div');
      checkElem.innerHTML = '<b>hi</b><script>alert("oops")</script>there<script>alert("derp")</script>';

      expect(testElem.isEqualNode(checkElem)).to.be.false;

      var safeElem = document.createElement('div');
      safeElem.innerHTML = '<b>hi</b>there';

      expect(testElem.isEqualNode(safeElem)).to.be.true;
    });

    it('should not remove safe attributes', function() {
      var testElem = document.createElement('div');
      Utils.saferSetInnerHTML(testElem, '<div id="rad" style="color:red">hi</div>');

      var checkElem = document.createElement('div');
      checkElem.innerHTML = '<div id="rad" style="color:red">hi</div>';

      expect(testElem.isEqualNode(checkElem)).to.be.true;

      expect(testElem.querySelector('#rad').style.color).to.equal('red');
    });

    it('should remove event handler attributes', function() {
      var testElem = document.createElement('div');
      Utils.saferSetInnerHTML(testElem, '<div id="rad" style="color:red" onclick="javascript:alert(\'derp\')">hi</div>');

      var checkElem = document.createElement('div');
      checkElem.innerHTML = '<div id="rad" style="color:red">hi</div>';

      expect(testElem.isEqualNode(checkElem)).to.be.true;

      expect(testElem.querySelector('#rad').style.color).to.equal('red');
      expect(testElem.querySelector('#rad').attributes.onclick).to.not.exist;
    });

  });

  describe('saferSetOuterHTML', function() {
    beforeEach(function() {
      // Our test container element, which will not be modified
      $('body').append($('<div id="test-container" style="display:none"><div id="test-elem"></div></div>'));
    });

    afterEach(function() {
      $('#test-container').remove();
    });

    it('should throw exception if element not in DOM', function() {
      var testElem = $('<div><b>bye</b></div>').get(0);

      var fn = _.partial(Utils.saferSetOuterHTML, '<p></p>');

      expect(fn).to.throw(Error);
    });

    it('should set safe HTML without alteration', function() {
      Utils.saferSetOuterHTML($('#test-container').children(':first').get(0), '<p>hi</p>');

      expect($('#test-container').html()).to.equal('<p>hi</p>');
    });

    it('should remove <script> elements', function() {
      Utils.saferSetOuterHTML($('#test-container').children(':first').get(0), '<b>hi</b><script>alert("oops")</script>there<script>alert("derp")</script>');

      expect($('#test-container').html()).to.equal('<b>hi</b>there');
    });

    it('should not remove safe attributes', function() {
      Utils.saferSetOuterHTML($('#test-container').children(':first').get(0), '<div id="rad" style="color:red">hi</div>');

      expect($('#test-container').html()).to.equal('<div id="rad" style="color:red">hi</div>');
    });

    it('should remove event handler attributes', function() {
      Utils.saferSetOuterHTML($('#test-container').children(':first').get(0), '<div id="rad" style="color:red" onclick="javascript:alert(\'derp\')">hi</div>');

      expect($('#test-container').html()).to.equal('<div id="rad" style="color:red">hi</div>');
    });
  });


  describe('getDocumentFragmentHTML', function() {
    var makeFragment = function(htmlArray) {
      var docFrag = document.createDocumentFragment();
      htmlArray.forEach(function(html) {
        docFrag.appendChild($(html).get(0));
      });

      return docFrag;
    };

    var makeTextFragment = function(text) {
      var docFrag = document.createDocumentFragment();
      var textNode = document.createTextNode(text);
      docFrag.appendChild(textNode);
      return docFrag;
    };

    it('should be okay with an empty fragment', function() {
      expect(Utils.getDocumentFragmentHTML(makeFragment([]))).to.equal('');
    });

    it('should return correct html', function() {
      var htmlArray = [
        '<div>aaa</div>',
        '<span><b>bbb</b></span>'
      ];

      var expectedHTML = htmlArray.join('');

      expect(Utils.getDocumentFragmentHTML(makeFragment(htmlArray))).to.equal(expectedHTML);
    });

    // Test issue #133: https://github.com/adam-p/markdown-here/issues/133
    // Thunderbird: raw HTML not rendering properly.
    // HTML text nodes were not being escaped properly.
    it('should escape HTML in a text node', function() {
      var docFrag = makeTextFragment('<span style="color:blue">im&blue</span>');
      var expectedHTML = '&lt;span style="color:blue"&gt;im&amp;blue&lt;/span&gt;';
      expect(Utils.getDocumentFragmentHTML(docFrag)).to.equal(expectedHTML);
    });
  });


  describe('isElementDescendant', function() {
    var $testOuter;

    before(function() {
      $testOuter = $('<div id="isElementDescendant-0"></div>')
        .appendTo('body')
        .append('<div id="isElementDescendant-1"><div id="isElementDescendant-1-1"></div></div>')
        .append('<div id="isElementDescendant-2"><div id="isElementDescendant-2-1"></div></div>');
    });

    after(function() {
      $testOuter.remove();
    });

    it('should correctly detect descendency', function() {
      expect(Utils.isElementDescendant(
        document.querySelector('#isElementDescendant-2'),
        document.querySelector('#isElementDescendant-2-1'))).to.equal(true);

      expect(Utils.isElementDescendant(
        document.querySelector('#isElementDescendant-0'),
        document.querySelector('#isElementDescendant-2-1'))).to.equal(true);
    });

    it('should correctly detect non-descendency', function() {
      expect(Utils.isElementDescendant(
        document.querySelector('#isElementDescendant-2-1'),
        document.querySelector('#isElementDescendant-2'))).to.equal(false);

      expect(Utils.isElementDescendant(
        document.querySelector('#isElementDescendant-2-1'),
        document.querySelector('#isElementDescendant-0'))).to.equal(false);

      expect(Utils.isElementDescendant(
        document.querySelector('#isElementDescendant-1'),
        document.querySelector('#isElementDescendant-2'))).to.equal(false);
    });
  });


  describe('getLocalFile', function() {
    it('should return correct data', function(done) {
      // We "know" our logo file starts with this string when base64'd
      var KNOWN_PREFIX = '<!DOCTYPE html>';
      var callback = function(data) {
        expect(data.slice(0, KNOWN_PREFIX.length)).to.equal(KNOWN_PREFIX);
        done();
      };

      Utils.getLocalFile('../options.html', 'text/html', callback);
    });

    it('should correctly handle absence of optional argument', function(done) {
      // We "know" our options.html file starts with this string
      var KNOWN_PREFIX = '<!DOCTYPE html>';
      var callback = function(data) {
        expect(data.slice(0, KNOWN_PREFIX.length)).to.equal(KNOWN_PREFIX);
        done();
      };

      Utils.getLocalFile('../options.html', callback);
    });

    it('should supply an error arg to callback if file not found', function(done) {
      Utils.getLocalFile('badfilename', function(val, err) {
        expect(err).to.be.ok;
        done();
      });
    });
  });

  describe('getLocalFileAsBase64', function() {
    it('should return data as Base64', function(done) {
      // We "know" our logo file starts with this string when base64'd
      var KNOWN_PREFIX = 'iVBORw0KGgo';
      var callback = function(data) {
        expect(data.slice(0, KNOWN_PREFIX.length)).to.equal(KNOWN_PREFIX);
        done();
      };

      Utils.getLocalFileAsBase64('../images/icon16.png', callback);
    });

    it('should supply an error arg to callback if file not found', function(done) {
      Utils.getLocalFile('badfilename', function(val, err) {
        expect(err).to.be.ok;
        done();
      });
    });
  });

  describe('getLocalURL', function() {
    it('should return a URL that can be used successfully', function(done) {
      // We're going to cheat a little and use the URL in a request to make
      // sure it works.
      // It would be tough to test otherwise without replicating the internal
      // logic of the function.

      var KNOWN_PREFIX = '<!DOCTYPE html>';
      var callback = function(data) {
        expect(data.slice(0, KNOWN_PREFIX.length)).to.equal(KNOWN_PREFIX);
        done();
      };

      var url = Utils.getLocalURL('/common/options.html');
      Utils.getLocalFile(url, 'text/html', callback);
    });
  });

  describe('fireMouseClick', function() {
    it('should properly fire a click event', function(done) {
      var elem = document.createElement('button');
      document.body.appendChild(elem);
      elem.addEventListener('click', function(event) {
        expect(event[Utils.MARKDOWN_HERE_EVENT]).to.be.true;
        document.body.removeChild(elem);
        done();
      });

      Utils.fireMouseClick(elem);
    });
  });

  describe('makeRequestToPrivilegedScript', function() {
    it('should communicate with privileged script', function(done) {
      Utils.makeRequestToPrivilegedScript(
        document,
        { action: 'test-request' },
        function(response) {
          expect(response).to.equal('test-request-good');
          done();
        });
    });
  });

  describe('setFocus', function() {
    it('should set focus into a contenteditable div', function() {
      var $div = $('<div contenteditable="true">').appendTo('body');
      expect(document.activeElement).to.not.equal($div.get(0));

      Utils.setFocus($div.get(0));
      expect(document.activeElement).to.equal($div.get(0));

      $div.remove();
    });

    it('should set focus into an iframe with contenteditable body', function() {
      var $iframe = $('<iframe>').appendTo('body');
      $iframe.get(0).contentDocument.body.contentEditable = true;
      expect(document.activeElement).to.not.equal($iframe.get(0));

      Utils.setFocus($iframe.get(0).contentDocument.body);
      expect(document.activeElement).to.equal($iframe.get(0));
      expect($iframe.get(0).contentDocument.activeElement).to.equal($iframe.get(0).contentDocument.body);

      $iframe.remove();
    });
  });

  describe('setFocus', function() {
    it('should not explode', function() {
      Utils.consoleLog('setFocus did not explode');
    });
  });

  describe('getTopURL', function() {
    it('should get the URL in a simple case', function() {
      expect(Utils.getTopURL(window)).to.equal(location.href);
    });

    it('should get the URL from an iframe', function() {
      var $iframe = $('<iframe>').appendTo('body');
      expect(Utils.getTopURL($iframe.get(0).contentWindow)).to.equal(location.href);
      $iframe.remove();
    });

    it('should get the hostname', function() {
      expect(Utils.getTopURL(window, true)).to.equal(location.hostname);
    });
  });

  describe('nextTick', function() {
    it('should call callback asynchronously and quickly', function(done) {
      var start = new Date();
      var called = false;
      Utils.nextTick(function() {
        called = true;
        expect(new Date() - start).to.be.lessThan(200);
        done();
      });
      expect(called).to.equal(false);
    });

    it('should properly set context', function(done) {
      var ctx = { hi: 'there' };

      Utils.nextTick(function() {
        expect(this).to.equal(ctx);
        done();
      }, ctx);
    });
  });

  describe('nextTickFn', function() {
    it('should return a function', function() {
      expect(Utils.nextTickFn(function(){})).to.be.a('function');
    });

    it('should return a function that calls callback asynchronously and quickly', function(done) {
      var start = new Date();
      var called = false;
      var fn = Utils.nextTickFn(function() {
        called = true;
        expect(new Date() - start).to.be.lessThan(200);
        done();
      });
      fn();
      expect(called).to.equal(false);
    });

    it('should properly set context', function(done) {
      var ctx = { hi: 'there' };

      var fn = Utils.nextTickFn(function() {
        expect(this).to.equal(ctx);
        done();
      }, ctx);
      fn();
    });
  });

  describe('getMessage', function() {
    it('should return a string', function() {
      // Since the exact string retuned depends on the current browser locale,
      // we'll just check that some string is returned.
      expect(Utils.getMessage('options_page__page_title')).to.be.a('string');
    });

    it('should throw on bad message ID', function() {
      var fn = _.partial(Utils.getMessage, 'BAADF00D');
      expect(fn).to.throw(Error);
    });
  });

  describe('registerStringBundleLoadListener', function() {
    it('should get called eventually', function(done) {
      Utils.registerStringBundleLoadListener(done);
    });
  });

  describe('getMoz/SafariStringBundle', function() {
    it('should get the string bundle', function(done) {
      if (typeof(chrome) !== 'undefined') {
        // not applicable
        done();
        return;
      }
      else if (typeof(safari) !== 'undefined') {
        Utils.getSafariStringBundle(function(data, err) {
          expect(err).to.not.be.ok;
          expect(data).to.be.an('object');
          done();
        });
      }
      else { // Mozilla
        var data = Utils.getMozStringBundle();
        if (data) {
          expect(data).to.be.an('object');
          done();
        }
        else {
          // HACK: make a call to the privileged script
          Utils.makeRequestToPrivilegedScript(document, {action: 'get-string-bundle'}, function(response) {
            expect(response).to.be.an('object');
            done();
          });
        }
      }
    });
  });

  describe('walkDOM', function() {
    beforeEach(function() {
      $('body').append($('<div id="test-container" style="display:none"><div id="test-elem"></div></div>'));
    });

    afterEach(function() {
      $('#test-container').remove();
    });

    it('should find an element in the DOM', function() {
      var found = false;
      Utils.walkDOM($('body')[0], function(node) {
        found = found || node.id === 'test-elem';
      });
      expect(found).to.be.true;
    });
  });

  describe('utf8StringToBase64', function() {
    it('should correctly encode a foreign-character string', function() {
      var str = 'hello, こんにちは';
      var base64 = 'aGVsbG8sIOOBk+OCk+OBq+OBoeOBrw==';
      expect(Utils.utf8StringToBase64(str)).to.equal(base64);
    });
  });

  describe('base64ToUTF8String', function() {
    it('should correctly encode a foreign-character string', function() {
      var str = 'این یک جمله آزمون است.';
      var base64 = '2KfbjNmGINuM2qkg2KzZhdmE2Ycg2KLYstmF2YjZhiDYp9iz2Kou';
      expect(Utils.base64ToUTF8String(base64)).to.equal(str);
    });
  });

  describe('rangeIntersectsNode', function() {
    beforeEach(function() {
      $('body').append($('<div id="test-container" style="display:none"><div id="test-elem-1"></div><div id="test-elem-2"></div></div>'));
    });

    afterEach(function() {
      $('#test-container').remove();
    });

    it('should detect a node in a range', function() {
      var range = document.createRange();
      range.selectNode($('#test-container')[0]);

      // Check the node that is selected.
      expect(Utils.rangeIntersectsNode(range, $('#test-container')[0])).to.be.true;

      // Check a node that is within the node that is selected.
      expect(Utils.rangeIntersectsNode(range, $('#test-elem-2')[0])).to.be.true;
    });

    it('should not detect a node not in a range', function() {
      var range = document.createRange();
      range.selectNode($('#test-elem-1')[0]);

      // The parent of the selected node *is* intersected.
      expect(Utils.rangeIntersectsNode(range, $('#test-container')[0])).to.be.true;

      // The sibling of the selected node *is not* intersected.
      expect(Utils.rangeIntersectsNode(range, $('#test-elem-2')[0])).to.be.false;
    });

    // I have found that Range.intersectsNode is broken on Chrome. I'm adding
    // test to see if/when it gets fixed.
    it('Range.intersectsNode is broken on Chrome', function() {
      var range = document.createRange();
      range.selectNode($('#test-elem-1')[0]);

      if (typeof(window.chrome) !== 'undefined' && navigator.userAgent.indexOf('Chrome') >= 0) {
        expect(range.intersectsNode($('#test-elem-2')[0])).to.be.true;
      }
    });
  });

});
