/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */


describe('Markdown-Render', function() {
  it('should exist', function() {
    expect(markdownRender).to.exist;
  });

  describe('convertHTMLtoMarkdown', function() {
    var convertHTMLtoMarkdown = markdownRender._testExports.convertHTMLtoMarkdown;

    it('should throw an exception for unsupported tags', function() {
      expect(_.partial(convertHTMLtoMarkdown, 'badtag')).to.throw(Error);
    });

    it('should not modify the string if there is no match', function() {
      var s = 'aaa <b>bbb</b> ccc <div>ddd</div> eee';
      expect(convertHTMLtoMarkdown('a', s)).to.equal(s);
    });

    it('should replace the given tag', function() {
      var s, target;

      s = 'aaa <b>bbb</b> ccc <div>ddd</div> eee <a href="fff">ggg</a> hhh';
      target = 'aaa <b>bbb</b> ccc <div>ddd</div> eee [ggg](fff) hhh';
      expect(convertHTMLtoMarkdown('a', s)).to.equal(target);

      s = 'aaa <b>bbb</b> ccc <div>ddd</div> eee <a href="fff">ggg</a> hhh <a href="iii">jjj <em>kkk</em></a> lll';
      target = 'aaa <b>bbb</b> ccc <div>ddd</div> eee [ggg](fff) hhh [jjj <em>kkk</em>](iii) lll';
      expect(convertHTMLtoMarkdown('a', s)).to.equal(target);
    });

  });
});
