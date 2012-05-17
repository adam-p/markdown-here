# <img src="//github.com/adam-p/markdown-here/raw/master/images/butterfly48.png" /> Markdown Here

*Markdown Here* is a Google Chrome extension that lets you write email in Markdown and render it before sending.

Writing email with code in it pretty tedious. Writing Markdown with code in it is easy. I found myself writing email in Markdown in the Github in-browser editor, then copying the preview into email. This is a pretty absurd workflow, so I decided create a tool to write and render Markdown right in the email.

<img width="700px" src="//github.com/adam-p/markdown-here/raw/master/chrome-store/markdown-here-image1.gimp.png" />

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

4. Right-click in the compose box and choose the "Markdown Toggle" item from the context menu.
5. You should see your email rendered correctly from Markdown into rich HTML.
6. Send your awesome email to everyone you know. It will appear to them the same way it looks to you.

### Revert to Markdown

After rendering your Markdown to pretty HTML, you can still get back to your original Markdown. Simply follow the same instructions as above -- your email compose body will change back to the Markdown you had written.

Note that any changes you make to the pretty HTML will be lost when you revert to Markdown.

In Gmail, you can also use the browser's Undo command (ctrl+z/cmd+z, or from the Edit menu). Be warned that you might also use the last few characters you entered.

### Replies and Piecemeal Conversion

Sometimes you don't want to convert the entire email; sometimes your email isn't entirely Markdown. The primary example of this is when you're writing a reply to an email: what you wrote -- either at the top or inline -- may be in Markdown, but no part of the original is. If you convert the entire email, the original will lose all formatting (at best).

To convert only part of the email, select the text (with your mouse or keyboard), right-click on it, and click the "Markdown Toggle" menu item. Your selection is magically rendered into pretty HTML. 

To revert back to Markdown, just put your cursor anywhere in the block of converted text, right click, and click the "Markdown Toggle" menu item again. Now it's magically back to the original Markdown.

<img width="700px" src="//github.com/adam-p/markdown-here/raw/master/chrome-store/markdown-here-image2.gimp.png" />

#### Things to know about converting a selection

* If you select only part of a block of text, the entire block will rendered and replaced.
  * In technical terms: if the selected range begins or ends in a text node, it will be expanded to the full element.

* Be aware that on Mac OS X (only >= Lion?), right clicking a word will cause that word to be selected, and that triggers *Markdown Here*'s selection-convert mode. So if you want to convert the whole email, right-click where there's no text.
  * It's okay to have a selection when reverting back to Markdown, so don't worry about right-clicking on text when doing that.

* You don't have to revert selections back to Markdown in the same order that you rendered them. Just right-click in a rendered block of text, click the menu item, and only that block will be reverted.

## Notes

* *Markdown Here* uses [Github Flavored Markdown](http://github.github.com/github-flavored-markdown/).

* Even though the extension is only known to work (to varying degrees )with Gmail, Yahoo, and Hotmail, we're not restricting what URLs the extension applies to. The hope is that it'll work in unexpected places. Reports of good (or bad) functionality is appreciated (create an issue). In the future the set of target URLs should be restricted.

## Compatibility

Short answer: Gmail is great.

<table>
  <tr>
    <th></th>
    <th>Compose</th>
    <th>Send</th>
    <th>Receive</th>
  </tr>
  <tr>
    <th>Gmail</th>
    <td>Perfect</td>
    <td>Perfect</td>
    <td>Perfect</td>
  </tr>
  <tr>
    <th>Hotmail</th>
    <td>Perfect</td>
    <td>Paragraph tags are lost.</td>
    <td>Perfect</td>
  </tr>
  <tr>
    <th>Yahoo</th>
    <td>Perfect</td>
    <td>Paragraph tags are lost (or replaced?).</td>
    <td>Paragraph tags are lost (or replaced?).</td>
  </tr>
</table>

*Compose*
> How *Markdown Here* behaves when composing an email. E.g., if rendering and reverting looks correct, styling is good, etc.

*Send*
> Negative effect that may occur when sending a rendered email from this webmail client. E.g., stripped tags and styles.

*Receive*
> How well this webmail client displays rendered email that it receives (assuming the sender is perfect).

## Next Steps

* Look into also making a Firefox extension.

* Test cases.

* Syntax hightlighting!
  * [SyntaxHighlighter](http://alexgorbatchev.com/SyntaxHighlighter/)
  * [Highlight.js](http://softwaremaniacs.org/soft/highlight/en/)
  * [google-code-prettify](https://code.google.com/p/google-code-prettify/)
  * [Rainbow](http://craig.is/making/rainbows)
  * There are more that require jQuery, but I just took it out…

* Add user option to create custom CSS.

* Add a configurable hotkey.

* Minify? Is there any advantage in extensions?
  * Orthogonal, but: Can Browserling be used?

* Add user option to specify Markdown dialect?

* Support images embedded in the Markdown (like, not hand-rolled image tags)? That will certainly deviate from straight Markdown, but maybe okay.

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
