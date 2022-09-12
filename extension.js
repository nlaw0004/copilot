// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const { ConsoleReporter } = require("@vscode/test-electron");
const { isConditionalExpression } = require("typescript");
const vscode = require("vscode");
var newRange = new vscode.Range(0, 0, 0, 0);
var edited = false;
var accepted = false;
var acceptedTime = null;
var numberOfAccepted = 0;
var numberOfEdited = 0;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "copilot" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "copilot.helloWorld",
    function () {
      // Display a message box to the user
      vscode.workspace.onDidChangeTextDocument((e) => {
        // current editor
        const editor = vscode.window.activeTextEditor;

        // initiate variables
        var textIsCopied = false;

        // check whether the filename is .py
        if (editor.document.languageId === "javascript") {
          // get current time in milliseconds
          var time = new Date().getTime();

          // if the file is accepted, check whether the time is within 60 seconds
          if (accepted && acceptedTime !== null) {
            if (time - acceptedTime > 60000) {
              console.log("time is up: Edit will not be counted");
              accepted = false;
              acceptedTime = null;
            }
          }

          // detect whether users have paste line(s) of code
          const content = e.contentChanges[0];
          var detectText = content.text;
          const keys = convertKeys(detectText);

          vscode.env.clipboard
            .readText()
            .then((text) => {
              // check whether the clipboard is empty
              if (text !== "") {
                // compare detectText and clipboard
                if (detectText === text) {
                  textIsCopied = true;
                }
              }
            })
            .then(function (result) {
              let documentIsEmpty = editor.document.getText() === "";

              // detect whether user has accepted code suggestion
              if (detectText.length > 20 && !textIsCopied) {
                console.log("COPILOT SUGGESTION ACCEPTED");
                //console.log(content.range.end);
                // Increment the number of accepted code suggestions
                if (!context.workspaceState.get("numberOfAccepted")) {
                  numberOfAccepted++;
                  context.workspaceState.update(
                    "numberOfAccepted",
                    numberOfAccepted
                  );
                  let noAcceptedWorkspaceState =
                    context.workspaceState.get("numberOfAccepted");
                  console.log(
                    "Total suggestions accepted: ",
                    noAcceptedWorkspaceState
                  );
                } else {
                  let noAcceptedWorkspaceState =
                    context.workspaceState.get("numberOfAccepted");
                  noAcceptedWorkspaceState++;
                  context.workspaceState.update(
                    "numberOfAccepted",
                    noAcceptedWorkspaceState
                  );
                  console.log(
                    "Total suggestions accepted: ",
                    noAcceptedWorkspaceState
                  );
                }

                // get cursor position
                var cursor_position = editor.selection.active;
                // detect whether user has edited code suggestion within 60 seconds

                // create new range
                newRange = newRange.with(content.range.end, cursor_position);

                // reset edited variable
                edited = false;
                accepted = true;

                // get accepted time
                acceptedTime = new Date().getTime();
              } else if (accepted && !documentIsEmpty) {
                // detect whether user has accepted a code suggestion within 60 seconds
                // get current position
                current_cursor_position = getCursorPosition(editor);

                // Check if this is the edit made before was a copilot edit (aka within the range).
                if (newRange.contains(current_cursor_position) && !edited) {
                  console.log("COPILOT SUGGESTION EDITED");
                  // increment number of edited counter
                  if (!context.workspaceState.get("numberOfEdited")) {
                    numberOfEdited++;
                    context.workspaceState.update(
                      "numberOfEdited",
                      numberOfEdited
                    );
                    let noEditedWorkspaceState =
                      context.workspaceState.get("numberOfEdited");
                    console.log(
                      "Total suggestions edited: ",
                      noEditedWorkspaceState
                    );
                  } else {
                    let noEditedWorkspaceState =
                      context.workspaceState.get("numberOfEdited");
                    noEditedWorkspaceState++;
                    context.workspaceState.update(
                      "numberOfEdited",
                      noEditedWorkspaceState
                    );
                    console.log(
                      "Total suggestions edited: ",
                      noEditedWorkspaceState
                    );
                  }
                  // edited variable set to true to make sure the edit is only counted once
                  edited = true;
                  // reset accepted variable to accept new code suggestion
                  accepted = false;
                }
              }
            });
        }
      });
    }
  );
  context.subscriptions.push(disposable);
}

function getCursorPosition(editor) {
  return editor.selection.active;
}

function convertKeys(key) {
  if (key === "\r\n" || key === "\n") return ["enter"];
  else if (key === "    ") return ["tab"];
  else if (key === " ") return ["space"];
  else if (/^[A-Z]{1}$/.test(key)) return ["shift", key.toLowerCase()];
  else if (/^[a-z]{1}$/.test(key)) return [key];
  else return [];
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

/**
 * 1. Keystrokes --> modify (CTRL-Z) --> Sandy
 * 2. Keystrokes --> unmodify (TAB) --> Natalie
 * 3. Time between accept and edit --> Natalie
 * 4. Logging Data --> Sandy - either save to workspace or as local variable and send email
 */
