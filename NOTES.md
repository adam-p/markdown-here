# Notes

> This file is a catch-all for ideas, problems, plans, and other miscellaneous notes. If something should instead be an issue, it should be made an issue.

* Update selection conversion screenshot to not be all about replies.

* un-module-ify 3rd party apps? Unnecessary change that just makes it harder to pull upstream.

* Marked: trailing (and leading?) newlines lost from fenced blocks. Create issue?

* Automated testing. Using PhantomJS?

* Add user option to specify Markdown dialect? This is probably part of a larger refactor/rewrite.

* Briefly highlight rendered and reverted blocks/ranges.
  * Probably use [CSS transitions](https://developer.mozilla.org/en/CSS/CSS_transitions).

* Add a visual cue as to what action took place. Sometimes converts and reverts may be a little surprising if the user's selection is off. And sometimes their viewport won't show the entirety of what change occurred.

* When Thunderbird sends and displays, it leaves the `md-data-original` attribute (which contains the original Markdown) intact. We could provide the user the ability to extract this. (I know at least one person who wants this.)

* Internationalization.

* If a selection conversion is *inside* a paragraph, then it shouldn't add a paragraph to the newly rendered text. That way the text flow won't be totally broken, and the user could actually render just part of a sentence or paragraph.
