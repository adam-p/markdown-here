Change Log
==========

2018-09-30: v2.13.4
--------------------

* Fixed [bug #524] and [bug #526]: Due to v2.13.3 fix, Markdown Here didn't work in Thunderbird with a non-English UI.
  - Thanks to [KSR-Yasuda](https://github.com/KSR-Yasuda), [ensleep](https://github.com/ensleep), [Pedro Silva](https://github.com/pmanu93), [Christophe Meyer](https://github.com/stombi), [littdky](https://github.com/littdky), [Michael Lashkevich](https://github.com/lashkevi), [morsedl](https://github.com/morsedl).


2018-09-11: v2.13.3
--------------------

* [Fixed bug #495](https://github.com/adam-p/markdown-here/issues/495): Markdown Here stopped working in Thunderbird version 60 (due to changes in Thunderbird).
  - Thanks to [dugite-code](https://github.com/dugite-code) for the [PR](https://github.com/adam-p/markdown-here/pull/518) to fix it. Also thanks to: [Marc-Alexandre Espiaut](https://github.com/marespiaut), [Tehmul Ghyara](https://github.com/tehmul), [Pedro Silva](https://github.com/pmanu93), [PackElend](https://github.com/PackElend), [qolii](https://github.com/qolii), [Francisco Pina-Martins](https://github.com/StuntsPT), [evazquez00](https://github.com/evazquez00).

* [Fixed bug #435](https://github.com/adam-p/markdown-here/issues/435): On some pages, Markdown Here would spew cross-origin exceptions to the console. This was due to MDH trying to determine if a focused iframe-within-an-iframe was renderable.
  - Thanks to [lincoln-b](https://github.com/lincoln-b) for reporting it.

* [Fixed bug #427](https://github.com/adam-p/markdown-here/issues/427): In Chrome and Firefox (at least for some pages), after rendering the resulting text was selected.
  - Thanks to [nedchu](https://github.com/nedchu) for reporting it.


2017-05-26: v2.13.1
--------------------

* Converted the **Firefox** version of Markdown Here to use the WebExtensions API. This makes MDH compatible with Firefox's new **multiprocess** architecture (aka **Electrolysis**). If you have an older version of MDH installed in Firefox, there will soon be a new release of that version which prompts you to install the new WebExtensions version.
  - The upgrade for existing Firefox users is a little rocky because the XUL version needs to continue to exist for Thunderbird (and Postbox) users. So the WebExtensions version has to fork.
  - The Firefox and Chrome code bases are now almost identical, so that's good.

* [Fixed bug# 369](https://github.com/adam-p/markdown-here/issues/369): Clicking Markdown Here's "Options" button in Firefox and Thunderbird (version 48+) causes the client application to hang. (Note that this only applies to the XUL version of the extension.)
  - Thanks to [Sam Estep](https://github.com/samestep), [r2evans](https://github.com/r2evans), [happyconfident](https://github.com/happyconfident), [Juan Salvador Aleixandre](https://github.com/juaalta), [haililihai](https://github.com/haililihai), [Shi Liang](https://github.com/shiliang-hust), [jjroper](https://github.com/jjroper), [Linxzh](https://github.com/l0o0).

* Updated jQuery to 3.2.1. This was required to pass Mozilla review.

* Wondering why there hasn't been a release in a while? My son was born a month after the last release. This is not a coincidence. You guys, having a kid is a lot of work.


2015-09-07: v2.12.0
--------------------

* **New logo!** Created by [Austin Anderson](http://protractor.ninja/) and chosen by the Markdown Here users, our great new logo is finally ready for action.
  - Much thanks to Austin for his work polishing and tweaking the 60 variants of the logo. He did a lot of work getting things just right.
  - Thanks to everyone else who submitted a design: [Rafe Goldberg](http://rgd2.co/), [Jack Reis](http://www.ux-jack.com/), [Enrique Esquinas](https://twitter.com/esquinas), [Leon Wilmanns](http://leon-wilmanns.de/). All of their designs were great and I would have been happy for any of them to win.
  - Seriously, if you haven't seen the other designs, [go check them out](http://markdown-here.com/logo.html). And then check out their portfolios, bookmark them, and contact them the next time you need design work done.
  - Thanks to all of you who took the time to vote for the new logo.
  - If you are unhappy with the change to a monochrome browser toolbar and context menu button, [\+1 this issue](https://github.com/adam-p/markdown-here/issues/302).

* [Fixed bug #297](https://github.com/adam-p/markdown-here/issues/297): Unrendering an email that is a reply to an email that was itself rendered with MDH would fail (if the original email were visible, like with Thunderbird or when it's expanded in Gmail).
  - Thanks to [Dave Tapley](https://github.com/dukedave) for creating a great video that illustrated the problem and how to reproduce it.
  - Repeatedly triggering this bug could also lead to the next bug...

* [Fixed bug #289](https://github.com/adam-p/markdown-here/issues/289): With forgot-to-render detection enabled, sending a large email could result in MDH causing the mail client to hang.
  - Thanks to [r2evans](https://github.com/r2evans), [Dave Tapley](https://github.com/dukedave), and [Eugene Fryntov](https://github.com/efryntov) for reporting and helping to diagnose the problem. Also thanks to [georg](https://stackoverflow.com/users/989121/georg) on StackOverflow for helping me to [understand and improve](https://stackoverflow.com/questions/31952381/end-of-string-regex-match-too-slow) the offending regex.

* [Fixed bug #283](https://github.com/adam-p/markdown-here/issues/283): Forgot-to-render detection was broken for Google Inbox. Thanks to [Marvin R.](https://github.com/therealmarv).
  - If you find that the forgot-to-render detection gets broken for the Gmail or Google Inbox web interfaces, please post to the ["markdown-here" Google Group](https://groups.google.com/group/markdown-here) or create [an issue in the Github project](https://github.com/adam-p/markdown-here/issues). The MDH code that hooks into the webmail UI is brittle and might break when Google changes stuff.

* [Fixed bug #288](https://github.com/adam-p/markdown-here/issues/288): Some character combinations involving a dollar sign in inline code would render incorrectly.
  - Thanks to [rfulkerson](https://github.com/rfulkerson) for reporting the problem.

* Updated and new translations:
  - French: [BenWayne182](https://crowdin.com/profile/benwayne182)
  - Spanish: [Darío Hereñú](https://github.com/kant)
  - Portuguese (Brazilian): [Erich Gubler](https://crowdin.com/profile/erichdongubler)


2015-05-26: v2.11.9
-------------------

* [Fixed bug #278](https://github.com/adam-p/markdown-here/issues/278): In the previous release, the `setTimeout` workaround to fix slow Chrome Beta caused Firefox to stop working. For some people. Sometimes. (But not in the unit tests. Ha.)
  - Thanks to [georgejean](https://github.com/georgejean), [Nathan Wittstock](https://github.com/fardog), [fugo](https://github.com/fugo), [Dheeraj Bhaskar](https://github.com/dheerajbhaskar), and [robred](https://github.com/robred).


2015-05-21: v2.11.8
-------------------

* [Fixed bug #251](https://github.com/adam-p/markdown-here/issues/251): Improved HTML-to-plaintext processing, in order to make newline handling better. Fixes some cases where tables get messed up. Thanks to [hchaase](https://github.com/hchaase).

* [Fixed bug #241](https://github.com/adam-p/markdown-here/issues/241): Rendering was very slow on Chrome Beta and Canary. Thanks to [Alex Vaystikh](https://github.com/bornio).

* Fixed [Pale Moon](http://www.palemoon.org/) compatibility. Thanks to Ismani Nieuweboer.

* Partially [fixed bug #104](https://github.com/adam-p/markdown-here/issues/104): Pre-rendered links (especially auto-links) in code were getting converted to Markdown when rendering (so you end up with raw Markdown in your code). This is now fixed for backtick-style code (inline and block), but not for indented code blocks.

* Updated translations:
  - German: [Boris Lewandowski](https://crowdin.com/profile/bl)
  - Spanish: [J. Ignacio Reta Sabarrós](https://crowdin.com/profile/jirsis)
  - Italian: [Alessandro Tondo](https://crowdin.com/profile/alextoind)


2015-04-06: v2.11.7
-------------------

* No user-facing code changes. Modifications to pass Mozilla review. (Added a preprocessor to strip out cross-browser code.)


2015-03-29: v2.11.5
-------------------

* [Fixed bug #243](https://github.com/adam-p/markdown-here/issues/243): Due to the way paragraphs were styled, there appeared to be a "blank line" inserted at the top when your Markdown-Here-rendered your content. The styling was changed to correct this.
  - **Note**: In order to get this styling change, you will need to [reset your Primary Styling CSS](https://github.com/adam-p/markdown-here/wiki/Troubleshooting#getting-the-latest-primary-styling-css).
  - Thanks to [James F McMahon](https://github.com/JamesMcMahon) for reporting the issue.

* Changed styling of sub-ordered-lists to match Github's: Top level is still numbers, first sub level is Roman letters, second sub level is Roman numerals. Will make your email lists look totally pro.
  - **Note**: In order to get this styling change, you will need to [reset your Primary Styling CSS](https://github.com/adam-p/markdown-here/wiki/Troubleshooting#getting-the-latest-primary-styling-css).
  - Thanks to [Andrew Greenberg](https://github.com/wizardwerdna) for [pointing out](https://github.com/adam-p/markdown-here/issues/255) Github's styling, and an unnamed user in a [Google Groups post](https://groups.google.com/forum/#!topic/markdown-here/E-5tSHCAlpg) who also asked about list styling.

* [Fixed bug #237](https://github.com/adam-p/markdown-here/issues/237): Made Mozilla preferences handling more robust. Helps to deal with non-ANSI characters, synchronization, and corruption.
  - Thanks to [flying-sheep](https://github.com/flying-sheep) for reporting the corruption problem and helping to diagnose it.

* Added and updated translations:
  - **Italian**: [Andrea Lazzarotto](https://crowdin.com/profile/Lazza)
  - German: [Boris Lewandowski](https://crowdin.com/profile/bl)
  - French: [H. Salah Eddine](https://crowdin.com/profile/jamesconception)
  - Turkish: [Yahya Erturan](https://crowdin.com/profile/yahyaerturan)

* And thanks to Erin for looking after Wulfie long enough for me to put this release together.


2015-02-16: v2.11.4
-------------------

* [Fixed bug #233](https://github.com/adam-p/markdown-here/issues/233): Reference links were broken if the URL part was pre-formatted.
  - Big thanks to [Meng Wang](https://github.com/wm8120) for finding this bug, fixing it, adding tests, and submitting a [pull request](https://github.com/adam-p/markdown-here/pull/232).

* Added forgot-to-render check support for "Inbox by Google".

* Updated translations:
  - Chinese Simplified: [Liu Cheng](https://crowdin.com/profile/willowcheng) and [sherkiv](https://crowdin.com/profile/sherkiv).
  - Chinese Traditional: [BestSteve](https://crowdin.com/profile/BestSteve).
  - Russian: [Asber](https://crowdin.com/profile/Asber).


2014-11-10: v2.11.3
-------------------

* **Improved compatibilty with screen readers**. Much thanks to [Sofian Babai](https://twitter.com/sofquipeut) for reporting the problem and helping to solve it. The primary fix target was Windows+Thunderbird+NVDA, but if anyone finds any cases where the fix is incomplete, please describe the scenario in the [Github issue](https://github.com/adam-p/markdown-here/issues/222) for it.
  - Thanks also to [Sukil Echenique](https://github.com/sukiletxe) for reporting the [original issue](https://github.com/adam-p/markdown-here/issues/185).

* [Fixed bug #223](https://github.com/adam-p/markdown-here/issues/223): Keyboard shortcut was not working in Gmail on Firefox.

* Added and updated translations:
  - **Polish**: [LeahCim](https://crowdin.com/profile/LeahCim).
  - **Portuguese (Brazilian)**: [Erik Neves](https://crowdin.com/profile/7kire).
  - **Chinese Traditional**: [Shen-Ta Hsiea](https://github.com/ibmibmibm).
  - Spanish: [sergiolunagarcia](https://crowdin.com/profile/sergiolunagarcia) and [J. Ignacio Reta Sabarrós](https://crowdin.com/profile/jirsis).
  - Japanese: [danpansa](https://crowdin.com/profile/danpansa).
  - Turkish: [trblnc](https://crowdin.com/profile/trblnc).
  - Chinese Simplified: [Liu Cheng](https://crowdin.com/profile/willowcheng).

* TeX math support is now enabled by default (for new users). ([Issue #213](https://github.com/adam-p/markdown-here/issues/213).)


2014-09-18: v2.11.2
-------------------

* [Fixed bug #141](https://github.com/adam-p/markdown-here/issues/141): Markdown Here in **Firefox would mysteriously stop working after a while** (aka the "ReferenceError: document is not defined" problem). It turns out that opening and closing a new browser window would trigger the bug.
  - This also manifested as ["Problem related with Zotero"](https://github.com/adam-p/markdown-here/issues/189) and ["Thunderbird: does not toggle when only the Write window is open"](https://github.com/adam-p/markdown-here/issues/175).
  - Thanks to everyone who reported this and helped diagnose it: [Ryan Heaton](https://github.com/stoicflame) (who [originally reported the bug](https://groups.google.com/forum/#!topic/markdown-here/ikXFqkP77Ws)), [darickard](https://github.com/darickard), [JacobEvelyn](https://github.com/JacobEvelyn), [Lennaick](https://github.com/lennaick), [Sherwood Botsford](https://plus.google.com/u/0/+SherwoodBotsford), [Cyrus David](https://github.com/vohof), and [iagobozza](https://github.com/iagobozza), who [shared a screencast](https://github.com/adam-p/markdown-here/issues/189) that finally provided a reproduction scenario and allowed us to figure out the bug.

* **Added support for "retina"** (high PPI) displays. The Markdown Here icons should now be nice and crisp. Closes [issue #205](https://github.com/adam-p/markdown-here/issues/205).
  - Caveats:
    - There doesn't seem to be a way to specify a high-res icon for Chrome's context menu item.
    - Postbox just doesn't seem to work. I don't think there's a regression, though.
    - I don't actually own any fancy retina-display computers, so... please create an issue if something is broken.
    - Thanks to [Alexandru Nedelcu](https://github.com/alexandru) for requesting this.

* [Fixed bug #202](https://github.com/adam-p/markdown-here/issues/202): In Options page, Markdown preview wasn't initially rendering.

* Updated translations.
  - Spanish: [Oscar del Pozo](https://crowdin.com/profile/oskar7) and [Rafa Couto](https://crowdin.com/profile/rafacouto).
  - Dutch: [yoroy](https://crowdin.com/profile/yoroy).
  - French: [nullepart](https://crowdin.com/profile/nullepart).
  - Chinese: [sherkiv](https://crowdin.com/profile/sherkiv).


2014-08-31: v2.11.1
-------------------

* [Fixed annoying bug #188](https://github.com/adam-p/markdown-here/issues/188): Keyboard shortcut was not working in Chrome+Gmail.
  - Thanks to: [Paulo Diovani Gonçalves](https://github.com/paulodiovani), [Edmundo Junior](https://github.com/edmundojr), [Mike Lindegarde](https://github.com/mlindegarde), [Jordi Gerona](https://github.com/jordi9), [Dilek](https://github.com/averagewizard), [Hrusikesh Panda](https://github.com/mrchief), [Clay McKell](https://github.com/kcmckell), [Trey Harris](https://groups.google.com/forum/#!topic/markdown-here/SnQ4fVtQvQQ).

* With the help of our hard-working translators, **six new translations** were added. They are: Chinese, French, German, Russian, Spanish, and Turkish.
  - Thanks to: [Antoine Proulx](https://crowdin.com/profile/magicienap), [ebouchut](https://crowdin.com/profile/ebouchut), [Lennaick](https://crowdin.com/profile/lennaick), [leftaroundabout](https://crowdin.com/profile/leftaroundabout), [Pierre Quillery](https://crowdin.com/profile/dandelionmood), [Ko-Chih Wu](https://crowdin.com/profile/mecca831), [Masahiro Umegaki](https://crowdin.com/profile/ume), [dlkgenc](https://crowdin.com/profile/dlkgenc), [turkish123](https://crowdin.com/profile/turkish123), [sergiolunagarcia](https://crowdin.com/profile/sergiolunagarcia), [Alexis Morelle](https://crowdin.com/profile/almorelle), and my friend and co-worker [Eugene Fryntov](https://crowdin.com/profile/efryntov). (You're all also in the [contributors list](https://github.com/adam-p/markdown-here/blob/master/CONTRIBUTING.md).)
  - If you'd like to start a new language, add to a not-quite-complete translation, or fix up something, please visit the [Markdown Here translation project on Crowdin](https://crowdin.com/project/markdown-here).

* **Updated [Highglight.js](http://highlightjs.org/)**, which is the syntax highlighting library used by Markdown Here.
  * **NOTE**: If your syntax higlighting looks wrong, switch your theme. Your styling might be stale.
  * Now supports **language aliases**. For example, `js` is an alias for `javascript`, `html` is an alias for `xml`, and `coffee`, `cson`, and `iced` are aliases for `coffeescript`. You can see the [complete list here](http://highlightjs.readthedocs.org/en/latest/css-classes-reference.html).
  * New languages: Makefile, Scilab, LiveCode Server, OCaml, Oxygene, Mathematica, Autohotkey, Gherkin, Elixir, NSIS, VIM script, Protocol Buffers, Nix, x86asm, Cap’n Proto and Thrift, Monkey, TypeScript, Nimrod, Gradle, Haxe, Swift, Groovy, Dart, Dust, Scheme, G-Code, Q.
  * New themes: Atelier, Paraíso, Kimbie, Colorbrewer, Codepen.io embed, Hybrid.
  * Lots of theme and language improvements.
  * This resolves MDH issues [#193](https://github.com/adam-p/markdown-here/issues/193) and [#196](https://github.com/adam-p/markdown-here/issues/196).
  * Make no mistake, all credit for this goes to [Ivan Sagalaev](https://github.com/isagalaev) and the [Hightlight.js contributors](https://github.com/isagalaev/highlight.js/blob/master/AUTHORS.en.txt).


2014-05-17: v2.11.0
-------------------

* Added ability to **de-render after saving**. After you render and save an **email draft** or an **Evernote** Note or a **Google Group post** or a **Blogger post** (or etc.), you can go back, edit it, and de-render it back to Markdown.
  * Fixes [#85](https://github.com/adam-p/markdown-here/issues/85) and [#86](https://github.com/adam-p/markdown-here/issues/86). Thanks to [Alfredo Canziani](https://github.com/Atcold), [HU, Pili](https://github.com/hupili), [Dima Tisnek](https://github.com/dimaqq), [dayer4b](https://github.com/dayer4b), [Bryan Cribbs](https://github.com/bdcribbs), [jmerlevede](https://github.com/jmerlevede), [portmantoad](https://github.com/portmantoad), and [Kurtis Rainbolt-Greene](https://github.com/krainboltgreene) for reporting the issue, suggesting solutions, and helping to test.
  * Deets for geeks: Below the rendered MD, in the same wrapper `div`, there is now a `div` with its `title` attribute set to the original MD (base64), containing a zero-width space, and styled to be zero-height. This delightful hack was the best combination of factors that ensured the raw MD would survive.

* Added a partial Korean translation, thanks to [dotvezz](https://crowdin.net/profile/dotvezz).
  * **Do you speak something in addition to English?** [At least half](https://addons.mozilla.org/en-US/firefox/addon/markdown-here/statistics/usage/languages/?last=30) of all Markdown Here users are not English, but Japanese is the only complete translation we have. **It's easy to help with translations** -- just try out the [Crowdin project for Markdown Here](https://crowdin.net/project/markdown-here). Thanks!

* Added ability to disable GFM line breaks.
  * Thanks to [ase34](https://github.com/ase34) and [violahs](https://github.com/violahs) for [requesting this](https://github.com/adam-p/markdown-here/issues/103).

* [Fixed bug #51](https://github.com/adam-p/markdown-here/issues/51): Links with URL text (like `[http://example.com](http://example.com`) weren't rendering properly.
  * Thanks to [Christopher Jeffrey](https://github.com/chjj) -- the author of [the rendering library](https://github.com/chjj/marked) that Markdown Here uses! -- for this fix.

* Altered default H1 and H2 header styles to match new GitHub styling. You'll have to click "Reset to Default" to get these styles.
  * Fixes [#177](https://github.com/adam-p/markdown-here/issues/177). Thanks to [Steven Willis](https://github.com/onlynone).

* [Fixed bug #173](https://github.com/adam-p/markdown-here/issues/173): Markdown Here was generating lots of errors in the console on sites with an `iframe` that use tight security  (like jsbin.com). Thanks to [Devin Weaver](https://github.com/sukima).


2014-01-29: v2.10.0
-------------------

* Markdown Here has been **translated into Japanese**! It's also **ready to be translated into your language**, so please take a look at [CONTRIBUTING.md](https://github.com/adam-p/markdown-here/blob/master/CONTRIBUTING.md) and our [Crowdin project](https://crowdin.net/project/markdown-here). Getting involved is super easy.
  * Huge thanks to [lambdaalice](https://github.com/lambdalice), who provided a [full Japanese translation](https://groups.google.com/forum/#!topic/markdown-here/2XoUrKY_CpQ) out of the blue, forcing me to [do the work](https://github.com/adam-p/markdown-here/issues/143) to be able to use it.

* The **automatic addition of anchors to headings** is now an option and **disabled by default**. Guido Hoermann quite rightly [pointed out](https://groups.google.com/d/msg/markdown-here/eaq1JoNhyws/s02CV8rTJ30J) that it creates annoying visual noise in Thunderbird. It's probably not used enough to justify being enabled by default, and it's very easy to re-enable it (bottom of the options page).

* The **"forgot-to-render" check** that was added in version 2.9.2 is now **enabled by default**. As always, please [file a bug](https://github.com/adam-p/markdown-here/issues/new) or [otherwise report](https://groups.google.com/forum/#!forum/markdown-here) if you have any problems or suggestions for improvement.

* Markdown Here now works with **older versions of Chrome and Chromium**. (Tested on version 24 and 25, which didn't work before but do now.)
  * Thanks to [Dustin Engstrom](https://github.com/engstrom) for providing the fix for this (and for submitting the first MDH code pull request!). Thanks to [Adam Kruger](https://github.com/adamkruger) for reporting the problem.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/120): In Chrome, options page link in upgrade notification was no longer working.


2013-11-07: v2.9.4
------------------

* **Updated [Highglight.js](http://highlightjs.org/)**, which is the syntax highlighting library used by Markdown Here.
  * New languages: Handlebars templates, Oracle Rules, F#, AsciiDoc, Lasso, SCSS, VB.NET, Mizar.
  * New themes: Docco, Foundation, Mono Blue, Monokai Sublime, Obsidian, Railscasts.
  * And lots of theme and language improvements.
  * This resolves MDH issues [#59](https://github.com/adam-p/markdown-here/issues/59) and [#114](https://github.com/adam-p/markdown-here/issues/114). Thanks to [Alex Pacini](https://github.com/alexpacini) and [Robert Jeppesen](https://github.com/rojepp) for reporting them.
  * Make no mistake, all credit for this goes to [Ivan Sagalaev](https://github.com/isagalaev) and the [Hightlight.js contributors](https://github.com/isagalaev/highlight.js/blob/master/AUTHORS.en.txt).

* Added some debug logging to help diagnose [issue #141](https://github.com/adam-p/markdown-here/issues/141). (And maybe fixed that issue, but probably not.)


2013-10-27: v2.9.3
------------------

* New feature: Added support for **smart arrows**. Here's how to use them:
  * `<--` ←
  * `-->` →
  * `<-->` ↔
  * `<==` ⇐
  * `==>` ⇒
  * `<==>` ⇔

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/137): Options were broken in Safari 7 (the Mavericks version).

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/133): In Thunderbird (mostly), raw HTML was not rendering properly. This is caused [another bug](https://github.com/adam-p/markdown-here/issues/135): using angular brackets makes contents invisible.
  * Thanks to [lihlii](https://github.com/lihlii), [Marcelo Diez](https://github.com/sorashadow), [Kaspar Emanuel](https://github.com/kasbah), and [Tim](https://github.com/fugo) for reporting and helping to solve this.


2013-10-18: v2.9.2
------------------

* Feature/fix: You may have found out the hard way that if you render, then make changes, and then unrender, you lose the changes. Now **Markdown Here will warn you when unrendering will cause you to lose changes**, and give you the choice of proceeding or not.
  * Due to JavaScript support differences, this feature is not supported in Postbox or Safari 5 (but it is supported in Safari 6+).
  * Thanks to [jakov](https://github.com/jakov) for [originally requesting](https://github.com/adam-p/markdown-here/issues/33) this change, and to [jdhines](https://github.com/jdhines) and [lihlii](https://github.com/lihlii) for also reporting/requesting it.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/119), for real this time: In Chrome, for some users, the Markdown Here upgrade notification would show up every time they opened Chrome.
  * Thanks again to [Chris/jhwarehouse](https://github.com/jhwarehouse) for reporting the bug still existed and helping to sort it out.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/128): Raw Markdown in rendered code blocks is detected by forgot-to-render check.
  * Thanks to [Menno Smits](https://github.com/mjs) for reporting the bug and helping to investigate.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/117): In Thunderbird, the new forgot-to-render check was incorrecting triggering on rendered links and headers.


2013-10-11: v2.9.1
------------------

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/112): If a bad language name was used for a code block (where "bad" might even just be "SQL" vs. "sql"), rendering would break. Language name case is now ignored.
  * Thanks to [Chris/jhwarehouse](https://github.com/jhwarehouse) for reporting the bug and helping to investigate.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/116): Markdown Here wasn't working on Postbox. Thanks to Branden C. for letting me know.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/109): In Chrome, for some users, the Markdown Here upgrade notification would show up every time they opened Chrome. (I couldn't reproduce it myself, but the notification display is less aggressive now.)
  * Thanks to [Chris/jhwarehouse](https://github.com/jhwarehouse), [Xarkam](https://github.com/Xarkam), [Tomáš Duda](https://github.com/TomasDuda), and [Emil Soman](https://github.com/emilsoman) for reporting the bug and helping to investigate.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/108): In Chrome, memory was leaking. The size of the leak was proportional to the number of tabs and how long they were left open.
  * I mitigated this in the Markdown Here code, but... it looks like it might actually be problem with Chrome itself. If someone familiar with Chrome/Chromium code and extension behaviour could help me I'd appreciate it. Here's a [Github Gist](https://gist.github.com/adam-p/6928614) I created that replicates the problem.
  * Thanks to [Thomas Broyer](https://github.com/tbroyer) for reporting this problem.


2013-10-07: v2.9.0
------------------

* New feature: **Forgot-to-render detection**. Have you ever forgotten to make your Markdown pretty before sending your email? Me too. Now Markdown Here will detect when your email contains raw Markdown and will give you second chance to go back and render it before sending.
  * This feature is supported in Thunderbird (and Postbox), and for Gmail in Chrome, Firefox, Opera, and Safari. (Pull requests welcome for Hotmail, Yahoo, etc.)
  * For now this feature is off by default because I'm nervous about too many false positives driving people crazy. But please opt in! The checkbox to enable it is at the bottom of the MDH Options page. And please give feedback on how the feature does or doesn't work for you, either in the [Github issue](https://github.com/adam-p/markdown-here/issues/90) or the [MDH Google Group](https://groups.google.com/forum/#!forum/markdown-here).
  * Thanks to [Petr Pudlák](https://github.com/ppetr) for requesting this in [issue #90](https://github.com/adam-p/markdown-here/issues/90), [Zhou Qiang](https://github.com/zhouqianghfut) in [issue #96](https://github.com/adam-p/markdown-here/issues/96), [Adam Backstrom](https://github.com/abackstrom) in [issue #98](https://github.com/adam-p/markdown-here/issues/98).

* **Compatibility improvements!**
  * Now works great with **Blogger** ([details](https://github.com/adam-p/markdown-here/wiki/Compatibility#blogger)).
    * The changes made will probably help with some other sites. If you tried out a site before and ended up with empty lines in your code blocks, try it again.
    * See the [Compatibility wiki page](https://github.com/adam-p/markdown-here/wiki/Compatibility#blogger) for details.
    * Thanks to [lambdaalice](https://github.com/lambdalice) for reporting the previous bad behaviour in [issue #89](https://github.com/adam-p/markdown-here/issues/89).
  * Now works very well with **Wordpress** ([details](https://github.com/adam-p/markdown-here/wiki/Compatibility#wordpress)).
  * See the [Compatibility wiki page](https://github.com/adam-p/markdown-here/wiki/Compatibility) for even more places where Markdown Here works, like **Google Sites** and **Facebook Notes**.

* New feature: **Automatic anchors for headers**. This makes it much easier to put a **table of contents** (or other intra-page links) inside your email or blog post. Just use the text of your header as the anchor link text. For example:
    ```no-highlight
    [See below](#Deep-Dive Details Section) for details.
    ...
    Deep-Dive Details Section
    =========================
    ...
    ```
  * Thanks to [Casey Watts](https://github.com/caseywatts) for requesting this and giving insight on how to do it. Closes issue [#93](https://github.com/adam-p/markdown-here/issues/93).

* Chrome and Firefox: Options page no longer opens when Markdown Here updates. Now there's a little notification in the corner of the window that can be clicked to show the MDH Options page (and the changes in the release), or dismissed.
  * Thanks to [Casey Watts](https://github.com/caseywatts) for his help. Closes issues [#64](https://github.com/adam-p/markdown-here/issues/64) and [#95](https://github.com/adam-p/markdown-here/issues/95).

* Added the ability to set **site-specific styles**. To see an example of how to do this, either reset your Primary Styling CSS or [take a look at the source for it](https://github.com/adam-p/markdown-here/blob/6d3c2efea23219b58da183df23da111f8fd9febb/src/common/default.css#L15).

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/84): Math: single-character formula won't render.
  * Thanks to kbeach who reported this [in a Google Groups post](https://groups.google.com/forum/#!msg/markdown-here/tolrITkqrx0/phElyPBBAhYJ).
  * Thanks again to [Emanuele D'Osualdo](https://github.com/bordaigorl) for providing the fix.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/83): `[a](b)` links shouldn't expand inside of a code block.
  * Thanks to [Dan Brown](https://github.com/jdanbrown) for reporting this bug.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/87): "Smart" quotations and apostrophes would sometimes get confused and curl the wrong way.
  * Thanks to [Jay Dixit](https://github.com/jaydixit) for reporting this bug.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/53): Shouldn't require blank line before list.


2013-08-24: v2.8.2
------------------

Added support for [**Opera**](http://www.opera.com)! Get it [here](https://addons.opera.com/en/extensions/details/markdown-here/).

2013-06-23: v2.8.1
------------------

**PLEASE NOTE:** If you've never customized your CSS, you should click the "Reset to Default" button for the "Primary Styling CSS". This will fix a bug (see below) and maybe give you better styling (if you installed MDH before version 2.7.0, Feb. 2013). If you have customized your CSS, you can [take a look at the changes to the default CSS](https://github.com/adam-p/markdown-here/commits/master/src/common/default.css) and decide what to take. A more elegant way of handling this is [being planned](https://github.com/adam-p/markdown-here/issues/78).

* The designer/artist of the Markdown Here logo has her own website up. You should check it out! http://tatianafryntoff.com/

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/69): Pre-formatted links break Markdown links.
  * Thanks to users Mitchell W. and [crdx](https://github.com/crdx) for reporting this bug.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/57): MD links should automatically add schema.
  * Thanks to [Casey Watts](https://github.com/caseywatts) for reporting this bug.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/70): Firefox/Thunderbird: Code blocks with horizontal scroll would have bad background colour.
  * Thanks to user Hans B. for reporting this bug.
  * Note that to get this bug fix, you either need to reset your "Primary Styling CSS" to default, or [manually apply the fix](https://github.com/adam-p/markdown-here/commit/4c9e0448251b4390ca6043fad5a75b1b6413464d).

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/52): Inline code line breaks are lost.
  * Thanks to user [CheechGe](https://github.com/CheechGe) for reporting this bug.

* [Fixed bug](https://github.com/adam-p/markdown-here/issues/77): Sometimes options page MD preview doesn't initially render.

2013-05-19: v2.8.0
------------------

* **Markdown Here now supports Safari!** [Get it here.](http://markdown-here.com/get.html)
  * Thanks to users [unscriptable](https://github.com/unscriptable) and [martinsvalin](https://github.com/martinsvalin) for [requesting it](https://github.com/adam-p/markdown-here/issues/38).

* Fixed bug in Firefox v23 (current Aurora): Options page wasn't working. ([See details.](https://github.com/adam-p/markdown-here/commit/c20b7e4841f325bed3201ea9a98b3f6c986cf8cc))

2013-03-05: v2.7.3
------------------

* Fixed Firefox+Linux bug ([#56](https://github.com/adam-p/markdown-here/issues/56)): Toolbar button icon was not displaying correctly.
  * Thanks to users [ynoxia](https://github.com/ynoxia) and [jljouannic](https://github.com/jljouannic) for reporting the bug.
* Fixed Firefox bug: Toolbar button would not stay removed when browser was restarted.
* Added support for Icedove (Debian version of Thunderbird).

2013-02-17: v2.7.2
------------------

* Pre-formatted links will now be retained. If you use your email editor's formatting controls to create a link, it will be retained when you toggle the Markdown Here rendering state.

* Firefox/Thunderbird: Fixed bug; Resetting the primary stying CSS wasn't working.

2013-02-13: v2.7.1
------------------

* Under-the-hood changes to satisfy Mozilla requirements.

2013-02-06: v2.7.0
------------------

* Markdown Here has a **new logo**! A big thank you to the talented [Tatiana A. Fryntoff](http://tatianafryntoff.com/) for creating our shiny new logo.

* Support for new Markdown features. All credit goes to chjj, the maintainer of the [Marked library](https://github.com/chjj/marked).
  * **Tables!** Now you can easily add tables to your email with Markdown. If you're not familiar with the syntax, check out [the wiki cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Here-Cheatsheet#wiki-tables). This closes [issue #13](https://github.com/adam-p/markdown-here/issues/13).
  * Strikethrough: Put double tildes around things to ~~strike it out~~ (`~~strike it out~~`).
  * Smarter lists: Have you ever had a numbered list mysteriously/annoyingly become a bullet list because it comes after one? Not anymore.
  * GFM line breaks: If you put a line break in your Markdown, it will be a line break after you toggle, instead of joining to form a single line. This closes [issue #12](https://github.com/adam-p/markdown-here/issues/12).

* Added a **Markdown Toggle button** to complement the context menu item and hotkey.
  * In Chrome and Firefox, this button will appear on the browser toolbar. It will be enabled when you're typing in a compose box that Markdown Here can work with.
    * You might notice the button enabled when you're typing in places other than your email page -- try it out! You might discover that Markdown Here works somewhere new. If you do, please [add it to the compatibility wiki](https://github.com/adam-p/markdown-here/wiki/Compatibility).
  * In Thunderbird and Postbox the appears on the formatting toolbar.
  * In Firefox, Thunderbird, and Postbox you can add/remove/move the button by right-clicking on the toolbar, clicking "Customize", and then dragging the button around. In Chrome you can remove it by right-click on it.
  * If you have any feedback about the new button, please join the ["markdown-here" Google Group discussion](https://groups.google.com/d/topic/markdown-here/NjQRYcD1mgY/discussion).
  * Thanks to user jakov for [suggesting this feature in issue #34](https://github.com/adam-p/markdown-here/issues/34).

* **Default styling changes**. Note that you'll have to reset your styles to get the new defaults (click "**Reset to Default**" on the options page). The changes include:
  * Slightly smaller header font size.
  * Less space between list items.
  * Link styling is now more standard (e.g., underlines in Gmail).
  * If you have any feedback on the default styling, please join the [Google Group discussion](https://groups.google.com/d/topic/markdown-here/V2n5ZxgzGQw/discussion).
  * Thanks to [Casey Watts](http://caseywatts.github.com/2012/12/17/markdown_in_gmail/) for his input.

* Added a "Basic Usage" section to the options page. This is in response to [a tweet](https://twitter.com/KSuzukiii/status/294376172295446528) from user KSuzukii.

* Yahoo and Hotmail/Outlook.com now work a bit better.

2013-01-02: v2.6.4
------------------

* Firefox/Thunderbird: Actually fixed the bug that I thought I fixed in v2.6.3. Much thanks to Daniel Ashton for letting me know that it was still busted and John Galt for assisting in the fix.

2012-12-01: v2.6.3
------------------

* Firefox/Thunderbird: [Fixed bug](https://github.com/adam-p/markdown-here/issues/37): Changes in Firefox/Thunderbird version 17 resulted in the options page not working correctly.

2012-10-06: v2.6.2
------------------

* Firefox/Thunderbird: [Fixed bug](https://github.com/adam-p/markdown-here/issues/31): Tabbing into the email body and then Markdown-Toggling via keyboard (i.e., never clicking the mouse in the message body) would result in the email body being lost when sent.
  * This is due to [a bug in Firefox/Thunderbird](https://bugzilla.mozilla.org/show_bug.cgi?id=740813).

* Discovered Wordpress post compatibility, thanks to user [Sina Iravanian](https://plus.google.com/116422808039109985732/posts). ([See details](https://github.com/adam-p/markdown-here/wiki/Compatibility).)

2012-09-09: v2.6.1
------------------

* Added hot-key (keyboard shortcut) support. The default key combination is <kbd>ctrl</kbd>+<kbd>alt</kbd>+<kbd>m</kbd>, but it is configurable from the Markdown Here options. Using the hot-key is identical to using the "Markdown Toggle" context menu item.

* Added basic support for the [Postbox](http://www.postbox-inc.com/) desktop email client, at the [request of a user](https://github.com/adam-p/markdown-here/issues/30). There are [some significant caveats](https://github.com/adam-p/markdown-here/wiki/Compatibility), like the lack of an options page.

* Fixed [bug](https://github.com/adam-p/markdown-here/issues/27): Gmail and Thunderbird reply exclusion wasn't working well, resulting in quoted replies getting messed up when doing a full (non-selection) rendering.

* Fixed: In Chrome on OS X, right-clicking on a word causes it to be selected. If "Markdown Toggle" were then clicked, it would render just that one word, which is lame. This behaviour is now avoided by not rendering single word selections -- if a single word is selected, the entire content will be rendered instead.

* Discovered [Evernote](https://evernote.com/) web-interface compatibility, thanks to user [markgoodson](https://github.com/markgoodson). ([See details](https://github.com/adam-p/markdown-here/wiki/Compatibility).)

2012-08-29: v2.6.0
------------------

* Added support for TeX math formulae. For info check out the Options page.
  * Note that this feature is disabled by default, due to privacy concerns. Again, the see the Options page for info.
  * Thanks to [bordaigorl](https://github.com/bordaigorl) for [suggesting this feature](https://github.com/adam-p/markdown-here/issues/26) and helping to implement it.

* Firefox/Thunderbird: Added Options page. (Chrome already had it.) Take a look around and play with the styles.

* Added a few new syntax highlighting themes. (Thanks to Highlight.js.)

2012-08-16: v2.5.3
------------------

* Chrome: Fixed compatibility with Chromium v18 (currently the version in the Ubuntu repo).
  * Limitation: Chromium v18 doesn't support synchronized settings. And when the user upgrades to a more recent version that supports `chrome.storage`, previous settings will not be migrated.
  * Thanks to [gingerlime](https://github.com/gingerlime) for [finding this bug](https://github.com/adam-p/markdown-here/issues/6#issuecomment-7769877) and helping to fix it.

2012-08-08: v2.5.2
------------------

* Firefox/Thunderbird: Minor change resulting from Mozilla review. (Fixed a "loose" variable.)

2012-08-02: v2.5.1
------------------

* Chrome: Fixed bug: In version 21 of Chrome, the Markdown Here options page no longer rendered correctly. (Chrome changed the display style name for flexbox layout from "-webkit-flexbox" to "-webkit-flex". Using bleeding edge CSS maybe wasn't a great idea.)

2012-07-27: v2.5.0
------------------

* Changed default styles (e.g., font sizes) to be more relative. This results, for example, in ordinary Markdown-Here-rendered text looking more like ordinary Gmail text instead of the previous somewhat jarring size change.
  * This also fixes a bug: Inline code in headings will now be the correct size.

* Chrome: Options page with changelist at top will be opened when *Markdown Here* updates.

* Significant changes under the hood to (hopefully!) allow *Markdown Here* to properly pass a full Mozilla review. For details, see [issue #21](https://github.com/adam-p/markdown-here/issues/21).

* Fixed bug: Empty line would appear at the top of rendered fenced code blocks that had been pasted.

* Removed feature/fixed bug: Pre-formatted links are no longer left intact. It conflicted with Marked.js's GFM behaviour of turning text that looks like a URL into a link. So if a pre-formatted link was created that used the URL as the text (e.g. `<a href="http://github.com">http://github.com</a>`), the resulting rendering would get messed up (`<a ...><a ...>...</a></a>`).
  - Let this be a lesson about the perils of frivolous features.

2012-07-21: v2.4.0
------------------

* Chrome: Added styling options. You can now edit the CSS used to style the rendered Markdown and choose between various syntax highlighting themes. These options are synchronized between your different installations of Chrome (if you have it enabled in Chrome).

* Removed feature: Pre-formatted text (colours, italics, bold, etc.) and lists (made using the email client rich edit controls, for example) are no longer left intact. It just caused too many problems and special cases (and would have required more special cases to get working again in Yahoo). Links are left intact.

  - There are still two ways to still get additional formatting:
      1. Format *after* Markdown-Toggling. Note that any changes -- including formatting -- made to rendered text will be lost if you toggle back to Markdown. So only do your additional formatting after you're happy with the rest.
      2. Add inline HTML with the desired formatting.
         * In your Markdown, you can use `<span>` or `<b>`, etc., to explicitly style your text. For example:

             ```
             Here is some <span style="background-color:red; font-size:2em;">*big red*</span> highlighting.
             ```
         * If you find you use inline tags with complex styles a lot, edit the CSS in the options to add a class that you can reuse for your inline tags. For example, in the CSS add:

             ```
             .bigred {
               background-color: red;
               font-size: 2em;
             }
             ```

             And then in your Markdown:

             ```
             Here is some <span class="red">*big red*</span> highlighting.
             ```

  - It saddens me to remove out this feature, but I think it's essentially creeping featurism that has a higher bug-danger-cost than it has an actually-useful-benefit. If this feature is/was important to you, please create an issue to let me know.

2012-06-20: v2.3.1
------------------

* Fixed bug: Yahoo: Code blocks would just show a bunch of span tags. (Introduced in 2.3.0.)

2012-06-20: v2.3.0
------------------

* Works with Google Groups posts! You can use it either in the GG rich compose box, or when sending posts via email.

* Added support for inline, pre-rendered images. Some email editors allow the user to drag-and-drop an image into an email body, and some allow users to select one from their computer or the web (or an emoticon in the email compose controls!). Previously, the image would be lost when a "Markdown Toggle" was done. Now the image will be retained.

* Pre-formatted text (colours, italics, bold, etc.), links, and lists (made using the email client rich edit controls, for example) are now left intact when rendering the Markdown.

* Added ability to convert a reply email in its entirety, rather than using the select-and-convert piecemeal approach.
  - This doesn't work with Yahoo and Hotmail, because they don't seem to quote the original email.
  - Resolves issue #14.

* Some styling changes.

* Bug fixes.

* Created a Markdown cheatsheet: https://github.com/adam-p/markdown-here/wiki/Markdown-Here-Cheatsheet


2012-06-07: v2.2.0
------------------

* Syntax highlighting! Coloured monospace text is super sexy.

* Email signatures are now excluded from conversion. Signatures must be preceded by "-- " (note the space at the end).

* Fixed block quotes.

* Much improved table and definition list styling.

* Better styling and consistency across browsers and mail clients.


2012-05-31: v2.1.3
------------------

* Firefox/Thunderbird: "Markdown Toggle" menu item will show up for non-rich-edit elements, but an error message will be given if the item is clicked. Hopefully this will help people notice that they're not using a rich editor, instead of wondering where the menu item is.

* Chrome: If the "Markdown Toggle" menu item is clicked for a non-rich-edit element, a helpful error message will be shown.

* Fixed bug: Significant trailing spaces were being stripped. This was breaking the Markdown syntax feature of two spaces at the end of the line indicating a hard line break.

* Changed context menu access key to 'k'. Previously, Chrome had no access key and Firefox/Thunderbird had the more-common letter 'm'.

* Other minor bugfixes.


2012-05-21: v2.1.2
------------------

* Chrome: Fixed manifest. Using manifest version 2 worked in debug, but not when published to the Store. Had to delete original Store extension in the process. :(

* Chrome: Updated manifest home page link to new Store address.


2012-05-21: v2.1.0
------------------

* Added Thunderbird support to Firefox extension.

* Tightened security restrictions in Chrome extension.


2012-05-20: v2.0.0
------------------

* Added Firefox extension.

* Chrome version: Moved most rendering code out of content scripts and into background scripts. This means less code needs to be loaded with each page. (The Firefox version also more or less behaves like this.)


2012-05-17: v1.2.1
------------------

* Bug fix: Rendering and reverting same selection (rather than reverting a point or selection within the original selection) would result in a loss of original Markdown.


2012-05-16: v1.2.0
------------------

* New feature: You can convert only part of an email by selected a region before clicking "Markdown Toggle". This is great for replies. To revert back to Markdown, right-click in the converted block and click "Markdown Toggle" again.


2012-05-15: v1.1.2
------------------

* Fixed issue with fonts sent and received by Yahoo.


2012-05-14: v1.1.1
------------------

* Fixed Gmail display of received rendered-from-Markdown email. Gmail was killing the `<style>` block, so styles are now also set explicitly on each element. Gmail works great now.


2012-05-13: v1.1.0
------------------

* Added ability to revert rendered HTML back to Markdown.


2012-05-12: v1.0.0
------------------

* Initial release.
