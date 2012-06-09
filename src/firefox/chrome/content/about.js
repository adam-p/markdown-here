Components.utils.import ('resource://gre/modules/XPCOMUtils.jsm');

const Cc = Components.classes;
const Ci = Components.interfaces;

function OpenWithAboutHandler () {
}

OpenWithAboutHandler.prototype = {
  newChannel : function (aURI) {
    if (!aURI.spec == 'about:markdown-here') return;
    var ios = Cc ['@mozilla.org/network/io-service;1'].getService (Ci.nsIIOService);
    var channel = ios.newChannel ('chrome://openwith/content/about-openwith.xul', null, null);
    channel.originalURI = aURI;
    return channel;
  },
  getURIFlags: function (aURI) {
    return Ci.nsIAboutModule.ALLOW_SCRIPT;
  },
  classDescription: 'About OpenWith Page',
  classID: Components.ID ('97ce549f-5ec6-460e-ad11-55a7bd190185'),
  contractID: '@mozilla.org/network/protocol/about;1?what=openwith',
  QueryInterface: XPCOMUtils.generateQI ([Ci.nsIAboutModule])
}

if (XPCOMUtils.generateNSGetFactory) {
  var NSGetFactory = XPCOMUtils.generateNSGetFactory ([OpenWithAboutHandler]);
} else {
  var NSGetModule = XPCOMUtils.generateNSGetModule ([OpenWithAboutHandler]);
}
