# Chrome Selective Menu Item Branch

In this branch I tried to get Chrome to only show the *Markdown Toggle* menuitem when the email compose element had focused -- as opposed to any editable element.

This code in this branch works in Gmail, but not Yahoo or Hotmail. I think the problem is that the latter two are loading iframes in dynamically, and the content script isn't getting triggered. So there's no 'mousedown' event getting wired to the compose element, and our item never shows.

The code I was trying was adapted from [this StackOverflow post](http://stackoverflow.com/a/4731303/729729).

I'm keeping this branch alive because it might be useful someday. And it's very non-trivial to figure out.
