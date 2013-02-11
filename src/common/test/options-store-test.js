/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

describe('OptionsStore', function() {
  it('should exist', function() {
    expect(OptionsStore).to.exist;
  });

  var testKey = 'test-option';

  beforeEach(function(done) {
    OptionsStore.remove([testKey], function() {
      done();
    });
  });

  after(function(done) {
    OptionsStore.remove([testKey], function() {
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
      expect(options).to.not.have.property(testKey);

      var obj = {};
      obj[testKey] = null;

      OptionsStore.set(obj, function() {
        OptionsStore.get(function(newOptions) {
          expect(newOptions).to.have.property(testKey);
          expect(newOptions[testKey]).to.be.null;
          done();
        });
      });
    });
  });

  it('should set and get long values', function(done) {
    var longString = (new Array(10*1024)).join('x');

    var obj = {};
    obj[testKey] = longString;

    OptionsStore.set(obj, function() {
      OptionsStore.get(function(newOptions) {
        expect(newOptions).to.have.property(testKey);
        expect(newOptions[testKey]).to.equal(longString);
        done();
      });
    });
  });

  it('should set and get objects', function(done) {
    OptionsStore.get(function(options) {
      expect(options).to.not.have.property(testKey);

      var obj = {};
      obj[testKey] = {
        'aaa': 111,
        'bbb': 'zzz',
        'ccc': ['q', 'w', 3, 4],
        'ddd': {'mmm': 'nnn'}
      };

      OptionsStore.set(obj, function() {
        OptionsStore.get(function(newOptions) {
          expect(newOptions).to.have.property(testKey);
          expect(newOptions[testKey]).to.eql(obj[testKey]);
          done();
        });
      });
    });
  });

  it('should set and get arrays', function(done) {
    OptionsStore.get(function(options) {
      expect(options).to.not.have.property(testKey);

      var obj = {};
      obj[testKey] = [1, 2, 'a', 'b', {'aa': 11}, ['q', 6]];

      OptionsStore.set(obj, function() {
        OptionsStore.get(function(newOptions) {
          expect(newOptions).to.have.property(testKey);
          expect(newOptions[testKey]).to.eql(obj[testKey]);

          // Note that this will fail on Firefox:
          // expect(newOptions[testKey].constructor).to.equal(Array);

          done();
        });
      });
    });
  });

  it('should remove entries', function(done) {
    OptionsStore.get(function(options) {
      expect(options).to.not.have.property(testKey);

      var obj = {};
      obj[testKey] = 'hi';

      OptionsStore.set(obj, function() {
        OptionsStore.get(function(newOptions) {
          expect(newOptions).to.have.property(testKey);
          expect(newOptions[testKey]).to.eql(obj[testKey]);

          OptionsStore.remove(testKey, function() {
            OptionsStore.get(function(newOptions) {
              expect(options).to.not.have.property(testKey);
              done();
            });
          });
        });
      });
    });
  });

});
