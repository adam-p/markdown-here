/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */


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

});