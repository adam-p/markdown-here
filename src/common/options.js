/*
 * Copyright Adam Pritchard 2012
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*global OptionsStore:false, chrome:false, markdownRender:false, $:false,
  htmlToText:false, marked:false, hljs:false, markdownHere:false, Utils:false*/

/*
 * Main script file for the options page.
 */

var cssEdit, cssSyntaxEdit, cssSyntaxSelect, rawMarkdownIframe, savedMsg,
    mathEnable, mathEdit, hotkeyShift, hotkeyCtrl, hotkeyAlt, hotkeyKey;

function onLoad() {
  var xhr;

  // Show/hide elements depending on platform
  showPlatformElements();

  // Set up our control references.
  cssEdit = document.getElementById('css-edit');
  cssSyntaxEdit = document.getElementById('css-syntax-edit');
  cssSyntaxSelect = document.getElementById('css-syntax-select');
  rawMarkdownIframe = document.getElementById('rendered-markdown');
  savedMsg = document.getElementById('saved-msg');
  mathEnable = document.getElementById('math-enable');
  mathEdit = document.getElementById('math-edit');
  hotkeyShift = document.getElementById('hotkey-shift');
  hotkeyCtrl = document.getElementById('hotkey-ctrl');
  hotkeyAlt = document.getElementById('hotkey-alt');
  hotkeyKey = document.getElementById('hotkey-key');

  //
  // Syntax highlighting styles and selection
  //

  // Get the available highlight.js styles.
  xhr = new XMLHttpRequest();
  xhr.overrideMimeType('application/json');
  xhr.open('GET', 'highlightjs/styles/styles.json');
  xhr.onreadystatechange = function() {
    if (this.readyState === this.DONE) {
      // Assume 200 OK -- it's just a local call
      var syntaxStyles = JSON.parse(this.responseText);

      for (var name in syntaxStyles) {
        cssSyntaxSelect.options.add(new Option(name, syntaxStyles[name]));
      }

      cssSyntaxSelect.options.add(new Option('Currently in use', ''));
      cssSyntaxSelect.selectedIndex = cssSyntaxSelect.options.length - 1;

      cssSyntaxSelect.addEventListener('change', cssSyntaxSelectChange);
    }
  };
  xhr.send();

  //
  // Restore previously set options (asynchronously)
  //

  OptionsStore.get(function(prefs) {
    cssEdit.value = prefs['main-css'];
    cssSyntaxEdit.value = prefs['syntax-css'];

    mathEnable.checked = prefs['math-enabled'];
    mathEdit.value = prefs['math-value'];

    hotkeyShift.checked = prefs.hotkey.shiftKey;
    hotkeyCtrl.checked = prefs.hotkey.ctrlKey;
    hotkeyAlt.checked = prefs.hotkey.altKey;
    hotkeyKey.value = prefs.hotkey.key;

    hotkeyChangeHandler();

    // Start watching for changes to the styles.
    setInterval(checkChange, 100);
  });

  // Load the changelist section
  loadChangelist();

  showDonatePlea();

  // Hide the tests link if the page isn't available. It may be stripped out
  // of extension packages, and it doesn't work in Thunderbird/Postbox.
  if (navigator.userAgent.indexOf('Chrome') < 0 &&
      navigator.userAgent.indexOf('Firefox') < 0 &&
      typeof(safari) === 'undefined') {
    $('#tests-link').hide();
  }
  else {
    // Check if our test file exists.
    // Note: Using $.ajax won't work because for local requests Firefox sets
    // status to 0 even on success. jQuery interprets this as an error.
    xhr = new XMLHttpRequest();
    xhr.open('HEAD', './test/index.html');
    // If we don't set the mimetype, Firefox will complain.
    xhr.overrideMimeType('text/plain');
    xhr.onreadystatechange = function() {
      if (this.readyState === this.DONE && !this.responseText) {
        // The test files aren't present, so hide the button.
        $('#tests-link').hide();
      }
    };
    xhr.send();
  }
}
document.addEventListener('DOMContentLoaded', onLoad, false);


// The Preview <iframe> will let us know when it's loaded, so that we can
// trigger the rendering of it.
document.addEventListener('options-iframe-loaded', function() {
  renderMarkdown();
});


// Shows/hide page elements depending on the current platform.
// E.g., not all usage instructions apply to all clients.
function showPlatformElements() {
  // This could be done more elegantly, but...
  if (navigator.userAgent.indexOf('Thunderbird') >= 0 ||
      navigator.userAgent.indexOf('Icedove') >= 0 ||
      navigator.userAgent.indexOf('Postbox') >= 0) {
    setClassVisibility(false, ['chrome-only']);
  }
  else if (navigator.userAgent.indexOf('Chrome') >= 0) {
    setClassVisibility(true, ['chrome-only']);
  }
  else if (navigator.userAgent.indexOf('Firefox') >= 0) {
    setClassVisibility(false, ['chrome-only']);
  }
  else {
    // Shouldn't happen. Don't modify anything.
  }

  function setClassVisibility(visible, classes) {
    var i, j, elems;
    for (i = 0; i < classes.length; i++) {
      elems = document.querySelectorAll('.'+classes[i]);
      for (j = 0; j < elems.length; j++) {
        elems[j].style.display = (visible ? "" : "none");
      }
    }
  }
}

// If the CSS changes and the Markdown compose box is rendered, update the
// rendering by toggling twice. If the compose box is not rendered, do nothing.
// Groups changes together rather than on every keystroke.
var lastOptions = '';
var lastChangeTime = null;
var firstSave = true;
function checkChange() {
  var newOptions =
        cssEdit.value + cssSyntaxEdit.value +
        mathEnable.checked + mathEdit.value +
        hotkeyShift.checked + hotkeyCtrl.checked + hotkeyAlt.checked + hotkeyKey.value;

  if (newOptions !== lastOptions) {
    // CSS has changed.
    lastOptions = newOptions;
    lastChangeTime = new Date();
  }
  else {
    // No change since the last check.
    // There's a delicate balance to choosing this apply/save-change timeout value.
    // We want the user to see the effects of their change quite quickly, but
    // we don't want to spam our saves (because there are quota limits). But we
    // have to save before we can re-render (the rendering using the saved values).
    if (lastChangeTime && (new Date() - lastChangeTime) > 400) {
      // Sufficient time has passed since the last change -- time to save.
      lastChangeTime = null;

      OptionsStore.set(
        {
          'main-css': cssEdit.value,
          'syntax-css': cssSyntaxEdit.value,
          'math-enabled': mathEnable.checked,
          'math-value': mathEdit.value,
          'hotkey': {
                      shiftKey: hotkeyShift.checked,
                      ctrlKey: hotkeyCtrl.checked,
                      altKey: hotkeyAlt.checked,
                      key: hotkeyKey.value
                    }
        },
        function() {
          updateMarkdownRender();

          // Show the "saved changes" message, unless this is the first save
          // (i.e., the one when the user first opens the options window).
          if (!firstSave) {
            savedMsg.classList.add('showing');

            // Hide it a bit later.
            // Alternatively, could use the 'transitionend' event. But this way
            // we control how long it shows.
            setTimeout(function() {
              savedMsg.classList.remove('showing');
            }, 2000);
          }
          firstSave = false;
        });
    }
  }
}

// This function stolen entirely from contentscript.js and ff-overlay.js
function requestMarkdownConversion(html, callback) {
  if (typeof(chrome) !== 'undefined' && typeof(chrome.extension) !== 'undefined') {
    // Send a request to the add-on script to actually do the rendering.
    chrome.extension.sendRequest({action: 'render', html: html}, function(response) {
      callback(response.html, response.css);
    });
  }
  else {
    // TODO: Implement a background script render service that can be used like
    // the Chrome one.
    OptionsStore.get(function(prefs) {
      callback(
        markdownRender(
          prefs,
          htmlToText,
          marked,
          hljs,
          html,
          rawMarkdownIframe.contentDocument),
        (prefs['main-css'] + prefs['syntax-css']));
    });
  }
}

// Render the sample Markdown.
function renderMarkdown(postRenderCallback) {
  if (rawMarkdownIframe.contentDocument.querySelector('.markdown-here-wrapper')) {
    // Already rendered.
    if (postRenderCallback) postRenderCallback();
    return;
  }

  // Begin rendering.
  markdownHere(rawMarkdownIframe.contentDocument, requestMarkdownConversionInterceptor);

  // To figure out when the (asynchronous) rendering is complete -- so we
  // can call the `postRenderCallback` -- we'll intercept the callback used
  // by the rendering service.

  function requestMarkdownConversionInterceptor(html, callback) {

    function callbackInterceptor() {
      callback.apply(null, arguments);

      // Rendering done. Call callback.
      if (postRenderCallback) postRenderCallback();
    }

    // Call the real rendering service.
    requestMarkdownConversion(html, callbackInterceptor);
  }
}

// Re-render already-rendered sample Markdown.
function updateMarkdownRender() {
  if (!rawMarkdownIframe.contentDocument.querySelector('.markdown-here-wrapper')) {
    // Not currently rendered, so nothing to update.
    return;
  }

  // To mitigate flickering, hide the iframe during rendering.
  rawMarkdownIframe.style.visibility = 'hidden';

  // Unrender
  markdownHere(rawMarkdownIframe.contentDocument, requestMarkdownConversion);

  // Re-render
  renderMarkdown(function() {
    rawMarkdownIframe.style.visibility = 'visible';
  });
}

// Toggle the render state of the sample Markdown.
function markdownToggle() {
  markdownHere(rawMarkdownIframe.contentDocument, requestMarkdownConversion);
}
document.querySelector('#markdown-toggle-button').addEventListener('click', markdownToggle, false);

// Reset the main CSS to default.
function resetCssEdit() {
  // Get the default value.
  var xhr = new XMLHttpRequest();
  xhr.overrideMimeType(OptionsStore.defaults['main-css']['__mimeType__']);
  xhr.open('GET', OptionsStore.defaults['main-css']['__defaultFromFile__']);
  xhr.onreadystatechange = function() {
    if (this.readyState === this.DONE) {
      // Assume 200 OK -- it's just a local call
      cssEdit.value = this.responseText;
    }
  };
  xhr.send();
}
document.getElementById('reset-button').addEventListener('click', resetCssEdit, false);

// The syntax hightlighting CSS combo-box selection changed.
function cssSyntaxSelectChange() {
  var selected = cssSyntaxSelect.options[cssSyntaxSelect.selectedIndex].value;
  if (!selected) {
    // This probably indicates that the user selected the "currently in use"
    // option, which is by definition what is in the edit box.
    return;
  }

  // Remove the "currently in use" option, since it doesn't make sense anymore.
  if (!cssSyntaxSelect.options[cssSyntaxSelect.options.length-1].value) {
    cssSyntaxSelect.options.length -= 1;
  }

  // Get the CSS for the selected theme.
  var xhr = new XMLHttpRequest();
  xhr.overrideMimeType('text/css');
  xhr.open('GET', 'highlightjs/styles/'+selected);
  xhr.onreadystatechange = function() {
    if (this.readyState === this.DONE) {
      // Assume 200 OK -- it's just a local call
      cssSyntaxEdit.value = this.responseText;
    }
  };
  xhr.send();
}

function loadChangelist() {
  var xhr = new XMLHttpRequest();
  xhr.overrideMimeType('text/plain');

  // Get the changelist from a local file.
  xhr.open('GET', 'CHANGES.md');
  xhr.onreadystatechange = function() {
    if (this.readyState === this.DONE) {
      // Assume 200 OK -- it's just a local call
      var changes = this.responseText;

      var markedOptions = {
            gfm: true,
            pedantic: false,
            sanitize: false };

      changes = marked(changes, markedOptions);

      Utils.saferSetInnerHTML($('#changelist').get(0), changes);

      var prevVer = location.search ? location.search.match(/prevVer=([0-9\.]+)/) : null;
      if (prevVer) {
        prevVer = prevVer[1]; // capture group

        var prevVerStart = $('#changelist h2').filter(function() { return $(this).text().match(new RegExp('v'+prevVer+'$')); });
        $('#changelist').find('h1:first').after('<h2>NEW</h2>').nextUntil(prevVerStart).wrapAll('<div class="changelist-new"></div>');

        // Move the changelist section up in the page
        $('#changelist-container').insertBefore('#options-container');
      }
    }
  };
  xhr.send();
}

// Choose one of the donate pleas to use, and update the donate info so we can
// A/B test them.
function showDonatePlea() {
  var $pleas = $('.donate-plea');
  var choice = Math.floor(Math.random() * $pleas.length);
  var $plea = $pleas.eq(choice);
  var pleaId = $plea.attr('id');

  $plea.removeClass('donate-plea-hidden');
  $('#donate-button input[name="item_number"]').prop('value', 'options-page-'+pleaId);
}

// Reset the math img tag template to default.
function resetMathEdit() {
  mathEdit.value = OptionsStore.defaults['math-value'];
}
document.getElementById('math-reset-button').addEventListener('click', resetMathEdit, false);

// When the user changes the hotkey key, check if it's an alphanumeric value.
// We only warning and not strictly enforcing because what's considered "alphanumeric"
// in other languages and/or on other keyboards might be different.
function hotkeyChangeHandler() {
  // Check for a valid key value.
  var regex = new RegExp('^[a-zA-Z0-9]+$');
  var value = hotkeyKey.value;
  if (value.length && !regex.test(value)) {
    $('#hotkey-key-warning').removeClass('hidden');
  }
  else {
    $('#hotkey-key-warning').addClass('hidden');
  }

  // Set any representations of the hotkey to the new value.

  var hotkeyPieces = [];
  if (hotkeyShift.checked) hotkeyPieces.push('SHIFT');
  if (hotkeyCtrl.checked) hotkeyPieces.push('CTRL');
  if (hotkeyAlt.checked) hotkeyPieces.push('ALT');
  if (hotkeyKey.value) hotkeyPieces.push(hotkeyKey.value.toString().toUpperCase());

  $('.hotkey-display').each(function(hotkeyElem) {
    if (hotkeyKey.value) {
      if ($(hotkeyElem).parent().hasClass('hotkey-display-wrapper')) {
        $(hotkeyElem).parent().css({display: ''});
      }
      $(hotkeyElem).css({display: ''});
      $(hotkeyElem).empty();

      $.each(hotkeyPieces, function(idx, piece) {
        if (idx > 0) {
          $(hotkeyElem).append(document.createTextNode('+'));
        }
        $(hotkeyElem).append('<kbd>').text(piece);
      });
    }
    else {
      if ($(hotkeyElem).parent().hasClass('hotkey-display-wrapper')) {
        $(hotkeyElem).parent().css({display: 'none'});
      }
      $(hotkeyElem).css({display: 'none'});
    }
  });
}
document.getElementById('hotkey-key').addEventListener('keyup', hotkeyChangeHandler, false);
document.getElementById('hotkey-shift').addEventListener('click', hotkeyChangeHandler, false);
document.getElementById('hotkey-ctrl').addEventListener('click', hotkeyChangeHandler, false);
document.getElementById('hotkey-alt').addEventListener('click', hotkeyChangeHandler, false);
