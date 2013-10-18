/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/* jshint curly:true, noempty:true, newcap:true, eqeqeq:true, eqnull:true, es5:true, undef:true, devel:true, browser:true, node:true, evil:false, latedef:false, nonew:true, trailing:false, immed:false, smarttabs:true, expr:true */
/* global describe, expect, it, before, beforeEach, after, afterEach */
/* global _, $, markdownRender, htmlToText, marked, hljs, Utils, OptionsStore */


describe('OptionsStore', function() {
  it('should exist', function() {
    expect(OptionsStore).to.exist;
  });

  var testKeys = ['test-option-a', 'test-option-b'];

  beforeEach(function(done) {
    OptionsStore.remove(testKeys, function() {
      done();
    });
  });

  after(function(done) {
    OptionsStore.remove(testKeys, function() {
      done();
    });
  });

  it('should call callback after getting', function(done) {
    OptionsStore.get(function() {
      done();
    });
  });

  it('should call callback after setting', function(done) {
    OptionsStore.set({}, function() {
      done();
    });
  });

  it('should call callback after removing', function(done) {
    OptionsStore.remove([], function() {
      done();
    });
  });

  it('should set and get null values', function(done) {
    OptionsStore.get(function(options) {
      expect(options).to.not.have.property(testKeys[0]);

      var obj = {};
      obj[testKeys[0]] = null;

      OptionsStore.set(obj, function() {
        OptionsStore.get(function(newOptions) {
          expect(newOptions).to.have.property(testKeys[0]);
          expect(newOptions[testKeys[0]]).to.be.null;
          done();
        });
      });
    });
  });

  it('should set and get long values', function(done) {
    var longString = (new Array(10*1024)).join('x');

    var obj = {};
    obj[testKeys[0]] = longString;

    OptionsStore.set(obj, function() {
      OptionsStore.get(function(newOptions) {
        expect(newOptions).to.have.property(testKeys[0]);
        expect(newOptions[testKeys[0]]).to.equal(longString);
        done();
      });
    });
  });

  it('should set and get objects', function(done) {
    OptionsStore.get(function(options) {
      expect(options).to.not.have.property(testKeys[0]);

      var obj = {};
      obj[testKeys[0]] = {
        'aaa': 111,
        'bbb': 'zzz',
        'ccc': ['q', 'w', 3, 4],
        'ddd': {'mmm': 'nnn'}
      };

      OptionsStore.set(obj, function() {
        OptionsStore.get(function(newOptions) {
          expect(newOptions).to.have.property(testKeys[0]);
          expect(newOptions[testKeys[0]]).to.eql(obj[testKeys[0]]);
          done();
        });
      });
    });
  });

  it('should set and get arrays', function(done) {
    OptionsStore.get(function(options) {
      expect(options).to.not.have.property(testKeys[0]);

      var obj = {};
      obj[testKeys[0]] = [1, 2, 'a', 'b', {'aa': 11}, ['q', 6]];

      OptionsStore.set(obj, function() {
        OptionsStore.get(function(newOptions) {
          expect(newOptions).to.have.property(testKeys[0]);
          expect(newOptions[testKeys[0]]).to.eql(obj[testKeys[0]]);
          expect(Array.isArray(newOptions[testKeys[0]])).to.be.true;
          expect(newOptions[testKeys[0]]).to.have.property('length');

          done();
        });
      });
    });
  });

  it('should remove entries', function(done) {
    OptionsStore.get(function(options) {
      expect(options).to.not.have.property(testKeys[0]);

      var obj = {};
      obj[testKeys[0]] = 'hi';

      OptionsStore.set(obj, function() {
        OptionsStore.get(function(newOptions) {
          expect(newOptions).to.have.property(testKeys[0]);
          expect(newOptions[testKeys[0]]).to.eql(obj[testKeys[0]]);

          OptionsStore.remove(testKeys[0], function() {
            OptionsStore.get(function(newOptions) {
              expect(options).to.not.have.property(testKeys[0]);
              done();
            });
          });
        });
      });
    });
  });

  it('should set and get multiple values', function(done) {
    OptionsStore.get(function(options) {
      expect(options).to.not.have.property(testKeys[0]);

      var obj = {};
      obj[testKeys[0]] = 'value the first';
      obj[testKeys[1]] = ['value the second'];

      OptionsStore.set(obj, function() {
        OptionsStore.get(function(newOptions) {
          expect(newOptions).to.have.property(testKeys[0]);
          expect(newOptions[testKeys[0]]).to.eql(obj[testKeys[0]]);
          expect(newOptions).to.have.property(testKeys[1]);
          expect(newOptions[testKeys[1]]).to.eql(obj[testKeys[1]]);
          done();
        });
      });
    });
  });

  describe('default value behaviour', function() {
    beforeEach(function() {
      delete OptionsStore.defaults[testKeys[0]];
    });

    after(function() {
      delete OptionsStore.defaults[testKeys[0]];
    });

    it('should not fill in defaults if there is not a default', function(done) {
      OptionsStore.get(function(options) {
        expect(options).to.not.have.property(testKeys[0]);

        done();
      });
    });

    it('should fill in defaults', function(done) {
      OptionsStore.get(function(options) {
        expect(options).to.not.have.property(testKeys[0]);

        // Set the default value (still pretty hacky)
        OptionsStore.defaults[testKeys[0]] = 'my default value';

        // Make sure we get the default value now
        OptionsStore.get(function(options) {
          expect(options).to.have.property(testKeys[0]);
          expect(options[testKeys[0]]).to.eql('my default value');

          done();
        });
      });
    });

    it('should not fill in default if value is set', function(done) {
      OptionsStore.get(function(options) {
        expect(options).to.not.have.property(testKeys[0]);

        // Set the default value (still pretty hacky)
        OptionsStore.defaults[testKeys[0]] = 'my default value';

        var obj = {};
        obj[testKeys[0]] = 'my non-default value';

        // But also set the value in the options
        OptionsStore.set(obj, function() {
          // Make sure we do *not* get the default value now
          OptionsStore.get(function(options) {
            expect(options).to.have.property(testKeys[0]);
            expect(options[testKeys[0]]).to.eql('my non-default value');

            done();
          });
        });
      });
    });

    it('should fill in default values from files', function(done) {
      OptionsStore.get(function(options) {
        expect(options).to.not.have.property(testKeys[0]);

        // Set a default value that requires a XHR
        OptionsStore.defaults[testKeys[0]] = {'__defaultFromFile__': window.location.href};

        // Note: Using $.ajax won't work because for local requests Firefox sets
        // status to 0 even on success. jQuery interprets this as an error.
        var xhr = new XMLHttpRequest();
        xhr.open('GET', window.location.href);
        // If we don't set the mimetype, Firefox will complain.
        xhr.overrideMimeType('text/plain');
        xhr.onreadystatechange = function() {
          if (this.readyState === this.DONE) {
            OptionsStore.get(function(options) {
              expect(options).to.have.property(testKeys[0]);
              expect(options[testKeys[0]]).to.eql(xhr.responseText);
              done();
            });
          }
        };
        xhr.send();
      });
    });

  });

});
