# Markdown Here

*Markdown Here* is a Google Chrome extension that lets you write email in Markdown and render it before sending.

Writing email with code in it pretty tedious. Writing Markdown with code in it is easy. I found myself writing email in Markdown in the Github in-browser editor, then copying the preview into email. This is a pretty absurd workflow, so I decided create a tool to write and render Markdown right in the email.

## Installation

### Via the Chrome Web Store

Go to the [Chrome Web Store page for *Markdown Here*](https://chrome.google.com/webstore/detail/bonncgjadmfcadjlopgmclakggdgpdnm) and install normally.

### Manual/Development

1. Clone this repo.
2. In Chrome, open the Extensions settings. (Wrench button, Tools, Extensions.)
3. On the Extensions settings page, click the "Developer Mode" checkbox.
4. Click the now-visible "Load unpacked extension…" button. Navigate to the directory where you cloned the repo.
5. The *Markdown Here* extension should now be visible in your extensions list.
6. Reload your webmail page before trying to convert an email.

## Use

1. In Chrome, log into your Gmail, Hotmail, or Yahoo account and start a new email.
2. Make sure you're using the rich editor. (In Gmail, click the "Rich formatting" link, if it's visible.)
3. Compose an email in Markdown. For example:

    ```
    **Hello** `world`.
    ```

4. Right-click in the compose box and choose the "Markdown Here" item from the context menu.
5. You should see your email rendered correctly from Markdown into rich HTML.
6. Send your awesome email to everyone you know. It will appear to them the same way it looks to you.

### Revert to Markdown

After rendering your Markdown to pretty HTML, you can still get back to your original Markdown. Simply follow the same instructions as above -- your email compose body will change back to the Markdown you had written.

Note that any changes you make to the pretty HTML will be lost when you revert to Markdown.

Caveat: In Gmail, another way to revert to Markdown is to use the browser's Undo command (ctrl+z/cmd+z, or from the Edit menu). But there's a big problem with this: The next time you try to use the *Markdown Here* command, it'll think you're reverting and cause you to lose your changes.

**TODO**: Fix that caveat. Maybe detect the Undo action? Or have a magical hidden element that indicates the render state?

## Notes

* *Markdown Here* uses [Github Flavored Markdown](http://github.github.com/github-flavored-markdown/).

* Even though the extension is only known to work (to varying degrees )with Gmail, Yahoo, and Hotmail, we're not restricting what URLs the extension applies to. The hope is that it'll work in unexpected places. Reports of good (or bad) functionality is appreciated (create an issue). In the future the set of target URLs should be restricted.

### Replies

Replies don't work very well. New Markdown (at the top, say) gets parsed fine, but the body of the previous email gets messed up (stripped of formatting, usually).

Some ideas for better behaviour:

* Add a command to convert the original email to Markdown. Then it can be converted back to HTML along with the new stuff.
  * Check out [to-markdown](https://github.com/domchristie/to-markdown), a HTML-to-Markdown converter.
  * This approach will surely be flaky.
  * Will need to accommodate users who only realize after writing some Markdown that they need to convert HTML to MD. So either let them convert a selection, or don't destroy their new MD while converting.
  
* Introduce a delimiter so that the user can indicate the extent of the Markdown conversion. So they can exclude the original email from the conversion.
  * Or maybe we can detect it, based on the "on this date, this person sent this email" line.
  * If there are start and end delimiters, it could be used for inline replies.
  
* Add ability to only do the Markdown conversion on a selection. 
  * Slightly mouse-y and fiddly, but maybe not bad.
  * Possibly a good general feature.
  * Can be used for inline replies as well.

## Compatibility

### Gmail

Rendering works well. Some styling (like background colors; maybe all styling?) is lost when viewing a from-Markdown email. (But not when sending such an email. For example, sending from Gmail to Hotmail retains styles.)

May be that all styles are getting stripped?

### Hotmail

Rendering works very well, both composing and viewing sent email. 

### Yahoo

Works okay. Paragraphs get turned into `<div>`, so they don't separate properly. This occurs both for email sent and received.

## Next Steps

* Make replies not busted.

* Use a lot more explicit CSS. For example, Yahoo overrides `<code>` tag styling with `display: block;`, so explicit styling was required to defeat that. There are probably a lot more instances where that's needed. 
  * Or maybe use CSS-reset/clear code? Should try that…
  * Maybe put all styles directly on tags. Gmail seems to strip the `<style>` block, but it leaves inline `style=` attributes intact.
    * Maybe it's not difficult? Insert the `<style>` block and the html, then walk the DOM, enumerating the styles for each element? (Ugh.)
      * Maybe there's code out there to help.

* Support embedded images? That will certainly deviate from straight Markdown, but maybe okay.

* Better CSS.

* Syntax hightlighting!

* Add user option to create custom CSS.

* Add a configurable hotkey.

* Minify? Is there any advantage in extensions?

* Add user option to specify Markdown dialect?

* Maybe use [to-markdown](https://github.com/domchristie/to-markdown) to convert rich-edited email to Markdown. This seems kind of dumb, but it might help with replies to already-rich emails.

## Credits

*Markdown Here* was coded on the shoulders of giants.

* Based on the Chrome extension pattern described in [antimatter15 / hideelements](https://github.com/antimatter15/hideelements).
* Markdown-to-HTML: [chjj / marked](https://github.com/chjj/marked)
* HTML-to-text: [mtrimpe / jsHtmlToText](https://github.com/mtrimpe/jsHtmlToText)
* Github-style CSS: [somebox's gist](https://gist.github.com/1082608)
* Icons by [dunedel via IconArchive](http://www.iconarchive.com/show/kaori-icons-by-dunedhel/Other-Butterfly-icon.html) (CC BY-NC-ND 3.0)

### Other stuff not used, but to keep an eye on

* Markdown-to-HTML: 
  * [evilstreak / markdown-js](https://github.com/evilstreak/markdown-js) (There's currently a GFM dialect that seems almost finished. See [issue #41](https://github.com/evilstreak/markdown-js/issues/41).)
  * [Pagedown](https://code.google.com/p/pagedown/)
  * [isaacs / github-flavored-markdown](https://github.com/isaacs/github-flavored-markdown) (A Showdown derivative)
  * [Showdown](https://github.com/coreyti/showdown)

* CSS:
  * [Mou.app](http://mouapp.com/)'s CSS looks pretty good. It can be found [here](https://github.com/borismus/markdown-preview/issues/16). I'm hesitant to use it because Mou isn't FOSS. 
  * This [Github theme for Mou](https://github.com/gcollazo/mou-theme-github2) might be good, though.

## Feedback

All bugs, feature requests, pull requests, feedback, etc., are welcome.

## License

http://adampritchard.mit-license.org/
