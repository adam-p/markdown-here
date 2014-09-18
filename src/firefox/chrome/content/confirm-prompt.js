/*
 * Copyright Adam Pritchard 2013
 * MIT License : http://adampritchard.mit-license.org/
 */

// Called once when the dialog displays
function onLoad() {
  // Use the arguments passed to us by the caller
  document.getElementById("promptInfo").value = window.arguments[0].inn.promptInfo;
  document.getElementById("promptQuestion").value = window.arguments[0].inn.promptQuestion;
  document.getElementById("promptSend").label = window.arguments[0].inn.promptSendButton;
  document.getElementById("promptBack").label = window.arguments[0].inn.promptBackButton;
}

// Called once if and only if the user clicks OK
function onOK() {
   // Return the changed arguments.
   // Notice if user clicks cancel, window.arguments[0].out remains null
   // because this function is never called
   window.arguments[0].out = true;
   return true;
}
