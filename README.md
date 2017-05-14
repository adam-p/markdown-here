# CPEN 321 Open Source Project

1. We added a Google Chrome badge to indicate to the user that their selection contains unrendered Markdown. This was in response to Issue #258.
2. Implementation:

* [/src/chrome/contentscript.js](https://github.com/dchanman/markdown-here/blob/master/src/chrome/contentscript.js) 
	* Added `setToggleButtonBadge()`, integrated it into the preexisting background checks
* [/src/chrome/backgroundscript.js](https://github.com/dchanman/markdown-here/blob/master/src/chrome/backgroundscript.js)
	* Added new request action `show-toggle-button-badge` to handle displaying the toggle button
* [/src/common/markdown-here.js](https://github.com/dchanman/markdown-here/blob/master/src/common/markdown-here.js)
	* Refactored common code into `getMarkdownRenderObject()`, created `selectionContainsRenderedMarkdown()`
* [/src/common/options.html](https://github.com/dchanman/markdown-here/blob/master/src/common/options.html)
	* Added fields to allow user to enable/disable the new toggle button badge
* [/src/common/options.js](https://github.com/dchanman/markdown-here/blob/master/src/common/options.js)
	* Added logic to deal with user enabling/disabling the toggle button badge
* [/src/common/test/markdown-here-test.js](https://github.com/dchanman/markdown-here/blob/master/src/common/test/markdown-here-test.js)
	* Created new test suite for our new function

You can see our full pull request at this link: https://github.com/adam-p/markdown-here/pull/315

(Note that our pull request is now closed. This is because we were originally pull requesting from master->adam_p. We had to change our base branch (master) and remake a pull request so that we could exclude this README from the pull request)
