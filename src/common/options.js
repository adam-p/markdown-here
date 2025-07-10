/*
 * Copyright Adam Pritchard 2015
 * MIT License : https://adampritchard.mit-license.org/
 */

"use strict";
/* jshint browser:true, sub:true */
/* global OptionsStore:false, chrome:false, marked:false, markdownHere:false, Utils:false,
   MdhHtmlToText:false */

/*
 * Main script file for the options page.
 */

let cssEdit, cssSyntaxEdit, cssSyntaxSelect, rawMarkdownIframe, savedMsg, mathEnable, mathEdit, forgotToRenderCheckEnabled, headerAnchorsEnabled, gfmLineBreaksEnabled;
let loaded = false;

function onLoad() {


  localize();

  // Set up our control references.
  cssEdit = document.getElementById('css-edit');
  cssSyntaxEdit = document.getElementById('css-syntax-edit');
  cssSyntaxSelect = document.getElementById('css-syntax-select');
  rawMarkdownIframe = document.getElementById('rendered-markdown');
  savedMsg = document.getElementById('saved-msg');
  mathEnable = document.getElementById('math-enable');
  mathEdit = document.getElementById('math-edit');
  forgotToRenderCheckEnabled = document.getElementById('forgot-to-render-check-enabled');
  headerAnchorsEnabled = document.getElementById('header-anchors-enabled');
  gfmLineBreaksEnabled = document.getElementById('gfm-line-breaks-enabled');

  rawMarkdownIframe.addEventListener('load', () => renderMarkdown());
  rawMarkdownIframe.src = Utils.getLocalURL('/common/options-iframe.html');

  forgotToRenderCheckEnabled.addEventListener('click', handleForgotToRenderChange, false);

  document.getElementById('extensions-shortcut-link').addEventListener('click', function(event) {
    event.preventDefault();
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  // Update the hotkey/shortcut value
  chrome.commands.getAll().then(commands => {
    const shortcut = commands[0].shortcut;
    if (!shortcut) {
      // No shortcut set, or a conflict (that we lose)
      document.querySelector('.hotkey-current-error').style.display = '';
      document.querySelectorAll('.hotkey-error-hide').forEach(el => el.style.display = 'none');
    }
    else {
      document.querySelectorAll('.hotkey-current').forEach(el => el.textContent = shortcut);
    }
  });

  // Listen for runtime messages from the background script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'button-click') {
      // Handle button click from background script by toggling markdown
      markdownToggle();
    }
    return false; // Synchronous response
  });

  //
  // Syntax highlighting styles and selection
  //

  // Get the available highlight.js styles.
  Utils.getLocalFile(
    Utils.getLocalURL('/common/highlightjs/styles/styles.json'),
    'json',
    function(syntaxStyles) {
      for (var name in syntaxStyles) {
        cssSyntaxSelect.options.add(new Option(name, syntaxStyles[name]));
      }

      cssSyntaxSelect.options.add(new Option(Utils.getMessage('currently_in_use'), ''));
      cssSyntaxSelect.selectedIndex = cssSyntaxSelect.options.length - 1;

      cssSyntaxSelect.addEventListener('change', cssSyntaxSelectChange);
    });

  //
  // Restore previously set options (asynchronously)
  //

  var optionsGetSuccessful = false;
  OptionsStore.get(function(prefs) {
    cssEdit.value = prefs['main-css'];
    cssSyntaxEdit.value = prefs['syntax-css'];

    mathEnable.checked = prefs['math-enabled'];
    mathEdit.value = prefs['math-value'];

    forgotToRenderCheckEnabled.checked = prefs['forgot-to-render-check-enabled-2'];

    headerAnchorsEnabled.checked = prefs['header-anchors-enabled'];

    gfmLineBreaksEnabled.checked = prefs['gfm-line-breaks-enabled'];

    // Start watching for changes to the styles.
    setInterval(checkChange, 100);

    optionsGetSuccessful = true;
  });

  // Load the changelist section
  loadChangelist();

  showDonatePlea();

  // Special effort is required to open the test page in these clients.
  if (navigator.userAgent.indexOf('Thunderbird') >= 0 ||
      navigator.userAgent.indexOf('Zotero') >= 0) {
    const testsLink = document.getElementById('tests-link');
    testsLink.addEventListener('click', function(event) {
      event.preventDefault();
      const link = testsLink.querySelector('a');
      Utils.makeRequestToPrivilegedScript(
        document,
        { action: 'open-tab', url: link.href });
    });
  }

  // Hide the tests link if the page isn't available. It may be stripped out
  // of extension packages.

  // Check if our test file exists. Note that we can't use Utils.getLocalFile as it throws
  // an asynchronous error if the file isn't found.
  // TODO: When Utils.getLocalFile is changed to return a promise, use it here.
  fetch('./test/index.html')
    .then(response => {
      if (!response.ok) {
        // The test files aren't present, so hide the button.
        document.getElementById('tests-link').style.display = 'none';
      }
      else {
        // When the file is absent, Firefox still gives a 200 status, but will throw an
        // error when the response is read.
        return response.text();
      }
    })
    .catch(err => {
      // The test files aren't present, so hide the button.
      document.getElementById('tests-link').style.display = 'none';
    });

  // Older Thunderbird may try to open this options page in a new ChromeWindow, and it
  // won't work. So in that case we need to tell the user how they can actually open the
  // options page. This is pretty ungraceful, but few users will encounter it, and fewer as
  // time goes on.
  setTimeout(function() {
    if (!optionsGetSuccessful) {
      alert('It looks like you are running an older version of Thunderbird.\nOpen the Markdown Here Options via the message window Tools menu.');
      window.close();
    }
  }, 500);

  loaded = true;
}
document.addEventListener('DOMContentLoaded', onLoad, false);


function localize() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(function(element) {
    const messageID = 'options_page__' + element.dataset.i18n;
    if (element.tagName.toUpperCase() === 'TITLE') {
      element.innerText = Utils.getMessage(messageID);
    }
    else {
      Utils.saferSetInnerHTML(element, Utils.getMessage(messageID));
    }
  });

  // Take this opportunity to show appropriate size images for the pixel
  // density. This saves us from having to make the `img` tags in the
  // translated content more complex.
  // TODO: Change to media queries (and so use background-image style).
  if (window.devicePixelRatio === 2) {
    const imageMap = [
      ['images/icon16.png', 'images/icon32.png'],
      ['images/icon16-button.png', 'images/icon32-button.png'],
      ['images/icon16-monochrome.png', 'images/icon32-monochrome.png'],
      ['images/icon16-button-monochrome.png', 'images/icon32-button-monochrome.png'],
      ['images/icon16-button-disabled.png', 'images/icon32-button-disabled.png']
    ];

    imageMap.forEach(function([oldSrc, newSrc]) {
      const imgs = document.querySelectorAll(`img[src="${oldSrc}"]`);
      imgs.forEach(function(img) {
        img.style.width = '16px';
        img.src = newSrc;
      });
    });
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
        forgotToRenderCheckEnabled.checked + headerAnchorsEnabled.checked +
        gfmLineBreaksEnabled.checked;

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
          'forgot-to-render-check-enabled-2': forgotToRenderCheckEnabled.checked,
          'header-anchors-enabled': headerAnchorsEnabled.checked,
          'gfm-line-breaks-enabled': gfmLineBreaksEnabled.checked
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
function requestMarkdownConversion(elem, range, callback) {
  var mdhHtmlToText = new MdhHtmlToText.MdhHtmlToText(elem, range);

  Utils.makeRequestToPrivilegedScript(
    document,
    { action: 'render', mdText: mdhHtmlToText.get() },
    function(response) {
      var renderedMarkdown = mdhHtmlToText.postprocess(response.html);
      callback(renderedMarkdown, response.css);
    });
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

  function requestMarkdownConversionInterceptor(elem, range, callback) {

    function callbackInterceptor() {
      callback.apply(null, arguments);

      // Rendering done. Call callback.
      if (postRenderCallback) postRenderCallback();
    }

    // Call the real rendering service.
    requestMarkdownConversion(elem, range, callbackInterceptor);
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
  Utils.getLocalFile(
    OptionsStore.defaults['main-css']['__defaultFromFile__'],
    OptionsStore.defaults['main-css']['__dataType__'],
    function(defaultValue) {
      cssEdit.value = defaultValue;
    });
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
  Utils.getLocalFile(
    Utils.getLocalURL('/common/highlightjs/styles/'+selected),
    'text',
    css => {
      cssSyntaxEdit.value = css;
    });
}

function loadChangelist() {
  Utils.getLocalFile(
    Utils.getLocalURL('/common/CHANGES.md'),
    'text',
    function(changes) {
      var markedOptions = {
            gfm: true,
            pedantic: false,
            sanitize: false };

      changes = marked(changes, markedOptions);

      Utils.saferSetInnerHTML(document.getElementById('changelist'), changes);

      const prevVer = location.search ? location.search.match(/prevVer=([0-9\.]+)/) : null;
      if (prevVer) {
        const version = prevVer[1]; // capture group

        const changelist = document.getElementById('changelist');
        const allH2s = changelist.querySelectorAll('h2');
        let prevVerStart = null;

        for (const h2 of allH2s) {
          if (h2.textContent.match(new RegExp('v'+version+'$'))) {
            prevVerStart = h2;
            break;
          }
        }

        const firstH1 = changelist.querySelector('h1:first-child');
        if (firstH1) {
          // Create and insert the new h2
          const newH2 = document.createElement('h2');
          newH2.textContent = Utils.getMessage('new_changelist_items');
          firstH1.insertAdjacentElement('afterend', newH2);

          // Collect elements between newH2 and prevVerStart
          const wrapper = document.createElement('div');
          wrapper.className = 'changelist-new';

          let current = newH2.nextElementSibling;
          while (current && current !== prevVerStart) {
            const next = current.nextElementSibling;
            wrapper.appendChild(current);
            current = next;
          }

          newH2.insertAdjacentElement('afterend', wrapper);
        }

        // Move the changelist section up in the page
        const changelistContainer = document.getElementById('changelist-container');
        const pagehead = document.getElementById('pagehead');
        pagehead.insertAdjacentElement('afterend', changelistContainer);
      }
    });
}

// Choose one of the donate pleas to use, and update the donate info so we can
// A/B test them.
function showDonatePlea() {
  const pleas = document.querySelectorAll('.donate-plea');
  const choice = Math.floor(Math.random() * pleas.length);
  const plea = pleas[choice];
  const pleaId = plea.id;
  const submitType = plea.dataset.submitType;

  const paypalSubmitImage = document.getElementById('paypal-submit-image');
  const paypalSubmitCss = document.getElementById('paypal-submit-css');

  if (paypalSubmitImage && paypalSubmitCss) {
    if (submitType === 'paypal-submit-image') {
      paypalSubmitImage.style.display = '';
      paypalSubmitCss.style.display = 'none';
    }
    else {
      paypalSubmitImage.style.display = 'none';
      paypalSubmitCss.style.display = '';
    }
  }

  plea.classList.remove('donate-plea-hidden');
  const itemNumberInput = document.querySelector('#donate-button input[name="item_number"]');
  if (itemNumberInput) {
    itemNumberInput.value = 'options-page-' + pleaId;
  }
}

// Reset the math img tag template to default.
function resetMathEdit() {
  mathEdit.value = OptionsStore.defaults['math-value'];
}
document.getElementById('math-reset-button').addEventListener('click', resetMathEdit, false);

// Handle forgot-to-render checkbox changes
async function handleForgotToRenderChange(event) {
  const isThunderbird = navigator.userAgent.indexOf('Thunderbird') !== -1;
  const origins = isThunderbird
    ? ['chrome://messenger/content/messengercompose/*'] // TODO: figure out if this is right -- it's probably not an "origin"
    : ['https://mail.google.com/'];

  if (event.target.checked) {
    // We're enabling forgot-to-render, so request permissions
    const granted = await ContentPermissions.requestPermission(origins);
    if (!granted) {
      // Permission denied - uncheck the checkbox
      forgotToRenderCheckEnabled.checked = false;
      // checkChange will pick up this change and save it
    }
  } else {
    // User is disabling forgot-to-render - remove permissions
    const removed = await ContentPermissions.removePermissions(origins);
    if (!removed) {
      console.error('Failed to remove permissions');
    }
  }
}
