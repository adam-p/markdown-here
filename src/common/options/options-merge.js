/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

"use strict";
/*global OptionsStore:false, chrome:false, markdownRender:false, $:false,
  htmlToText:false, marked:false, hljs:false, markdownHere:false, Utils:false,
  OptionsCommon: false*/

/*
 * Main script file for the Options Merge breakout window.
 */


var OptionsMerge = (function() {
  var setupMergely = function() {
    $('#compare').mergely({
      cmsettings: { readOnly: false, lineNumbers: true, mode: 'text/css' },
      width: 'auto',
      height: '400px',
      editor_height: 'auto',
      _debug: '', // suppress mergely console output
      resized: function() {
        $('.CodeMirror').each(function() {
          $(this).height($(this).parents('#compare').height());
        });
      }
    });

    // Load the left side from the value in the options
    OptionsStore.get(function(prefs) {
      $('#compare').mergely('lhs', prefs['main-css']);
    });

    // Load the right side from the default value
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType(OptionsStore.defaults['main-css']['__mimeType__']);
    xhr.open('GET', OptionsStore.defaults['main-css']['__defaultFromFile__']);
    xhr.onreadystatechange = function() {
      if (this.readyState === this.DONE) {
        // Assume 200 OK -- it's just a local call
        $('#compare').mergely('rhs', this.responseText);
      }
    };
    xhr.send();

    $('#merge-right').click(function() {
      $('#compare').mergely('merge', 'rhs');
    });

    $('#merge-left').click(function() {
      $('#compare').mergely('merge', 'lhs');
    });
  };

  // The Preview <iframe> will let us know when it's loaded, so that we can
  // trigger the rendering of it.
  var iframeLoaded = false;
  $(document).on('options-iframe-loaded', function() {
    iframeLoaded = true;
  });

  // Returns 'lhs' or 'rhs'
  var getPreviewSideChoice = function() {
    var selectedID = $('#preview-css-choice .active').attr('id');
    return (selectedID.indexOf('rhs') >= 0) ? 'rhs' : 'lhs';
  };

  // We need to get a little tricksy to make the Markdown rendering use the CSS
  // displayed in this window (rather than the CSS in the stored options).
  var prepareRequestMarkdownConversion = function() {
    // Figure out which side's CSS to use
    var mainCSS = $('#compare').mergely('get', getPreviewSideChoice());

    var requestMarkdownConversion = function(html, callback) {
      OptionsStore.get(function(prefs) {
        callback(
          markdownRender(
            prefs,
            htmlToText,
            marked,
            hljs,
            html,
            $('#rendered-markdown')[0].contentDocument),
          (mainCSS + prefs['syntax-css']));
      });
    };

    return requestMarkdownConversion;
  };

  var prevLHS = '', prevRHS = '', prevSidePreview = '';

  // Does the first Markdown render. Calls callback when complete.
  var doInitialRender = function(callback) {
    // There are three things that need to be ready in order to render:
    // the DOM must be loaded, the iframe must be loaded, and mergely must be
    // loaded. If we don't have all three, set a timer and check again.

    // Note: Mergely's "loaded" event/callback doesn't seem to actually work.
    // That is, when it fires, the content of the editor isn't yet available.
    // So we're going to determine "mergely ready" by checking if we get content
    // from the editor.
    // This approach fails if the user's CSS has been completely deleted. But...
    // that shouldn't happen?
    prevLHS = $('#compare').mergely('get', 'lhs');
    prevRHS = $('#compare').mergely('get', 'rhs');
    var mergelyReady = prevLHS && prevRHS;

    prevSidePreview = getPreviewSideChoice();

    if ($.isReady && iframeLoaded && mergelyReady) {
      OptionsCommon.renderMarkdown(prepareRequestMarkdownConversion(), callback);
    }
    else {
      setTimeout(function() {doInitialRender(callback);}, 100);
    }
  };

  var checkChange = function() {
    var currLHS = $('#compare').mergely('get', 'lhs');
    var currRHS = $('#compare').mergely('get', 'rhs');
    var currSidePreview = getPreviewSideChoice();
    if (currLHS === prevLHS &&
        currRHS === prevRHS &&
        currSidePreview === prevSidePreview) {
      return;
    }

    prevLHS = currLHS;
    prevRHS = currRHS;
    prevSidePreview = currSidePreview;

    OptionsCommon.updateMarkdownRender(prepareRequestMarkdownConversion());
  };

  var switchSidePreview = function() {
    OptionsCommon.updateMarkdownRender(prepareRequestMarkdownConversion());
  };

  // Side must be 'lhs' or 'rhs'
  var saveCSS = function(side) {
    var css = $('#compare').mergely('get', 'lhs');
    if (!css) {
      // Something is pretty wrong
      window.alert("It looks like you're trying to save an empty CSS value. You probably don't want to do that.");
      return;
    }

    localStorage.setItem('options-merge-css', css);

    // window.close only works if the window was opened via Javascript. So, for
    // example, it won't work if the browser was closed and tab restored.
    window.close();
    // Wait a bit to see if the window closes, and then alert the user if it not.
    setTimeout(function() {
      window.alert('Your CSS has been saved. Please close this tab now.');
    }, 200);
  };

  return {
    setupMergely: setupMergely,
    doInitialRender: doInitialRender,
    checkChange: checkChange,
    switchSidePreview: switchSidePreview,
    saveCSS: saveCSS
  };
})();


$(function() {
  OptionsMerge.setupMergely();

  OptionsMerge.doInitialRender(function() {
    // When the initial render is complete, set up the change watcher.
    setInterval(OptionsMerge.checkChange, 100);
  });

  // Make the preview iframe fille the available vertical space at the bottom
  var iframeMinHeight = $('iframe').height();
  $(window).resize(function() {
    // 10 is a fudge factor
    var availableHeight = $(window).height() - $('iframe').offset().top - 10;
    $('iframe').height(Math.max(iframeMinHeight, availableHeight));
  }).resize();  // And trigger an initial resize event

  // Set up the save button handler
  $('.save-css').click(function() {
    if ($(this).attr('id').indexOf('rhs') >= 0) {
      OptionsMerge.saveCSS('rhs');
    }
    else {
      OptionsMerge.saveCSS('lhs');
    }
  });
});
