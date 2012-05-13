# Markdown Here

**Markdown Here** is a Google Chrome extension that lets you write email in markdown and render it before sending.

Writing email with code in it pretty tedious. Writing markdown with code in it is easy. I found myself writing email in markdown in the Github in-browser editor, then copying the preview into email. This is a pretty absurd workflow, so I decided create a tool to write and render markdown right in the email.

## Notes

* Even though the extension is only known to work (to varying degrees )with Gmail, Yahoo, and Hotmail, we're not restricting what URLs the extension applies to. The hope is that it'll work in unexpected places. Reports of good (or bad) functionality is appreciated (create an issue). In the future the set of target URLs should be restricted.

### Replies

Replies don't work very well. New markdown (at the top, say), gets parsed fine, but the body of the previous email gets messed (stripped of formatting, usually).

Some ideas for better behaviour:

* Add a command to convert the original email to markdown. Then it can be converted back to HTML along with the new stuff.
  * Check out [to-markdown](https://github.com/domchristie/to-markdown), a HTML-to-markdown converter.
  * This approach will surely be flaky.
  * Will need to accommodate users who only realize after writing some markdown that they need to convert HTML to MD. So either let them convert a selection, or don't destroy their new MD while converting.
  
* Introduce a delimiter so that the user can indicate the extent of the markdown conversion. So they can exclude the original email from the conversion.
  * Or maybe we can detect it, based on the "on this date, this person sent this email" line.
  * If there are start and end delimiters, it could be used for inline replies.
  
* Add ability to only do the markdown conversion on a selection. 
  * Slightly mouse-y and fiddly, but maybe not bad.
  * Possibly a good general feature.
  * Can be used for inline replies as well.

## Compatibility

### Gmail

Works well. Some styling (like background colors; maybe all styling?) is lost when viewing a from-markdown email. (But not when sending such an email. For example, sending from Gmail to Hotmail retains styles.)

May be that all styles are getting stripped?

### Hotmail

Works very well.

### Yahoo

Works okay. Paragraphs get turned into `<div>`, so they don't separate properly. This occurs both for email sent and received.

## Roadmap

* Make replies not busted.

* Use a lot more explicit CSS. For example, Yahoo overrides `<code>` tag styling with `display: block;`, so explicit styling was required to defeat that. There are probably a lot more instances where that's needed. 
  * Or maybe use CSS-reset/clear code? Should try that…
  * Maybe put all styles directly on tags. Gmail seems to strip the `<style>` block, but it leaves inline `style=` attributes intact.
    * Maybe it's not difficult? Insert the `<style>` block and the html, then walk the DOM, enumerating the styles for each element? (Ugh.)
      * Maybe there's code out there to help.

* Better CSS.

* Syntax hightlighting!

* Add user option to create custom CSS.

* Add an undo command. ctrl+z/cmd+z works fairly well, but it often undoes more than just the markdown conversion -- often a few keystrokes also disappear.

* Add a configurable hotkey.

* Minify? Is there any advantage in extensions?

* Add user option to specify markdown dialect?

* Maybe use [to-markdown](https://github.com/domchristie/to-markdown) to convert rich-edited email to markdown. This seems kind of dumb, but it might help with replies to already-rich emails.

## Credits

**Markdown Here** was coded on the shoulders of giants.

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

## Feedback

All bugs, feature requests, pull requests, feedback, etc., are welcome.

## License

http://adampritchard.mit-license.org/
