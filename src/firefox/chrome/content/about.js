Components.utils.import ('resource://gre/modules/XPCOMUtils.jsm');

const Cc = Components.classes;
const Ci = Components.interfaces;

function MarkdownHereAboutHandler () {
}

MarkdownHereAboutHandler.prototype = {
  newChannel : function (aURI) {
    if (!aURI.spec == 'about:markdown-here') return;
    var ios = Cc ['@mozilla.org/network/io-service;1'].getService (Ci.nsIIOService);
    var channel = ios.newChannel ('resource://common/prefs.html', null, null);
    channel.originalURI = aURI;
    return channel;
  },
  getURIFlags: function (aURI) {
    return Ci.nsIAboutModule.ALLOW_SCRIPT;
  },
  classDescription: 'Markdown Here Preferences Page',
  classID: Components.ID ('97ce549f-5ec6-460e-ad11-55a7bd190185'),
  contractID: '@mozilla.org/network/protocol/about;1?what=markdow-here',
  QueryInterface: XPCOMUtils.generateQI ([Ci.nsIAboutModule])
}

if (XPCOMUtils.generateNSGetFactory) {
  var NSGetFactory = XPCOMUtils.generateNSGetFactory ([MarkdownHereAboutHandler]);
} else {
  var NSGetModule = XPCOMUtils.generateNSGetModule ([MarkdownHereAboutHandler]);
}
