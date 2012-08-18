/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */


;(function() {

/*
 * Chrome storage helper. Gets around the synchronized value size limit.
 * Overall quota limits still apply (or less, but we should stay well within).
 * Limitations:
 *   - `get` gets the entire options object and `set` sets the entire options
 *     object (unlike the underlying `chrome.storage.sync` functions).
 *
 * Long strings are broken into pieces and stored in separate fields. They are
 * recombined when retrieved.
 *
 * Note that we fall back to (unsynced) localStorage if chrome.storage isn't 
 * available. This is the case in Chromium v18 (currently the latest available
 * via Ubuntu repo).
 */

// TODO: Check for errors. See: https://code.google.com/chrome/extensions/dev/storage.html
// TODO: Store as JSON?

var ChromeOptionsStore = {

  // The options object will be passed to `callback`
  get: function(callback) {
    var that = this;

    this._storageGet(function(sync) {
      // Process the object, extracting divided entries.
      var tempobj = {}, finalobj = {};
      for (var key in sync) {
        var val = sync[key];
        var divIndex = key.indexOf(that._div);

        if (divIndex < 0) {
          finalobj[key] = val;
        }
        else {
          var keybase = key.slice(0, divIndex);
          var keynum = key.slice(divIndex+that._div.length);
          tempobj[keybase] = tempobj[keybase] || [];
          tempobj[keybase][keynum] = val;
        }
      }

      // Recombine the divided entries.
      for (key in tempobj) {
        finalobj[key] = tempobj[key].join('');
      }

      callback(finalobj);
    });
  },

  // Store `obj`, splitting long strings when necessary. `callback` will be 
  // called (with no arguments) when complete.
  set: function(obj, callback) {
    var that = this;

    // First clear out existing entries.
    this._clearExisting(obj, function() {
      var finalobj = {};
      for (var key in obj) {
        var val = obj[key];
        if (typeof(val) !== 'string' || val.length < that._maxlen()) {
          // Don't need to split, or can't.
          finalobj[key] = val;
        }
        else {
          var pieces = Math.ceil(val.length / that._maxlen());
          for (var i = 0; i < pieces; i++) {
            finalobj[key+that._div+i] = val.substr(i*that._maxlen(), that._maxlen());
          }
        }
      }

      that._storageSet(finalobj, function() {
        if (callback) callback();
      });
    });
  },

  // Stored string pieces look like: {'key##0': 'the quick ', 'key##1': 'brown fox'}
  _div: '##',

  // HACK: Using the full length, or length-keylength, gives quota error.
  // Because 
  _maxlen: function() {
    // Note that chrome.storage.sync.QUOTA_BYTES_PER_ITEM is in bytes, but JavaScript
    // strings are UTF-16, so we need to divide by 2.
    // Some JS string info: http://rosettacode.org/wiki/String_length#JavaScript
    if (chrome.storage) {
      return chrome.storage.sync.QUOTA_BYTES_PER_ITEM / 2;
    }
    else {
      // 2048 is the default value for chrome.storage.sync.QUOTA_BYTES_PER_ITEM, so...
      return 2048 / 2;
    }

  },

  _storageGet: function(callback) {
    if (chrome.storage) {
      chrome.storage.sync.get(null, callback);
      return;
    }
    else {
      // Make this actually an async call.
      setTimeout(function() {
        var i, obj = {};
        for (i = 0; i < localStorage.length; i++) {
          obj[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
        }
        callback(obj);
      });
      return;
    }
  },

  _storageSet: function(obj, callback) {
    if (chrome.storage) {
      chrome.storage.sync.set(obj, callback);
      return;
    }
    else {
      // Make this actually an async call.
      setTimeout(function() {
        var key;
        for (key in obj) {
          localStorage.setItem(key, obj[key]);
        }
        if (callback) callback();
      });
      return;
    }
  },

  _storageRemove: function(keysToDelete, callback) {
    if (chrome.storage) {
      chrome.storage.sync.remove(keysToDelete, callback);
      return;
    }
    else {
      // Make this actually an async call.
      setTimeout(function() {
        var i;
        for (i = 0; i < keysToDelete.length; i++) {
          localStorage.removeItem(keysToDelete[i]);
        }
        callback();
      });
      return;      
    }
  },

  // Clear any existing entries that match the given object's members.
  _clearExisting: function(obj, callback) {
    var that = this;

    this._storageGet(function(sync) {
      var keysToDelete = [];
      for (var objKey in obj) {
        for (var syncKey in sync) {
          if (syncKey === objKey || syncKey.indexOf(objKey+that._div) === 0) {
            keysToDelete.push(syncKey);
          }
        }
      }

      if (keysToDelete.length > 0) {
        that._storageRemove(keysToDelete, callback);
      }
      else {
        if (callback) callback();
      }
    });
  }
};

/*
 * Mozilla preferences storage helper
 */

var MozillaOptionsStore = {
  
  get: function(callback) {
    this._sendRequest({action: 'get'}, callback);
  },

  set: function(obj, callback) {
    this._sendRequest({action: 'set', obj: obj}, callback);
  },

  // This is called both from content and background scripts, and we need vastly
  // different code in those cases. When calling from a content script, we need 
  // to make a request to a background service (found in firefox/chrome/content/options.js).
  // When called from a background script, we're going to access the browser prefs
  // directly. Unfortunately, this means duplicating some code from the background
  // service.
  _sendRequest: function(data, callback) { // analogue of chrome.extension.sendRequest
    var prefs, prefKeys, prefsObj, request, sender;

    try {
      prefs = Components.classes['@mozilla.org/preferences-service;1']
                        .getService(Components.interfaces.nsIPrefService)
                        .getBranch('extensions.markdown-here.');

      if (data.action === 'get') {
        prefKeys = prefs.getChildList('');
        prefsObj = {};

        for (i = 0; i < prefKeys.length; i++) {
          prefsObj[prefKeys[i]] = JSON.parse(prefs.getCharPref(prefKeys[i]));
        }

        callback(prefsObj);
        return;
      }
      else if (data.action === 'set') {
        for (i in data.obj) {
          prefs.setCharPref(i, JSON.stringify(data.obj[i]));
        }

        if (callback) callback();
        return;
      }
    }
    catch (e) {
      request = document.createTextNode('');
      request.setUserData('data', data, null);
      if (callback) {
        request.setUserData('callback', callback, null);

        document.addEventListener('markdown_here-options-response', function(event) {
          var node, callback, response;
          node = event.target;
          callback = node.getUserData('callback');
          response = node.getUserData('response');

          document.documentElement.removeChild(node);

          document.removeEventListener('markdown_here-options-response', arguments.callee, false);

          callback(response);
          return;
        }, false);
      }
      document.documentElement.appendChild(request);

      sender = document.createEvent('HTMLEvents');
      sender.initEvent('markdown_here-options-query', true, false);
      request.dispatchEvent(sender);
    }
  }
};

var EXPORTED_SYMBOLS = ['OptionsStore'];

if (typeof(navigator) !== 'undefined' && navigator.userAgent.indexOf('Chrome') >= 0) {
  this.OptionsStore = ChromeOptionsStore;
}
else {
  this.OptionsStore = MozillaOptionsStore;
}

this.EXPORTED_SYMBOLS = EXPORTED_SYMBOLS;

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
