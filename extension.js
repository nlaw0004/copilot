// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const nodemailer = require("nodemailer");
var userId = Math.floor(Math.random() * 100000);
var newRange = new vscode.Range(0, 0, 0, 0);
var numberOfAccepted = 0;
var numberOfEdited = 0;
var currentFile = {};
var currentChange = {};

/**
 * What has been found:
 * a) The onDidCloseTextDocument event is not fired when a file is closed but rather when the user switches to another file
 *    - this means that there is no point of keeping track of different file data, but rather we have to keep track of accepts and edits at different range in the same file
 *    - this means that the dict will be changed to this format to keep track
 *      {
 *        userid: int,
 *        filename: "name of the file",
 *        docClosedTime: time,
 *        changes: {
 *         RANGE: {
 *           prefix: "what was typed before code is suggested",
 *           codesuggested: "what was suggested by GitHub Copilot",
 *           acceptedTime: time,
 *           editedCodeSnippets: "The editted code suggestion"
 *           accepted: boolean,
 *           edited: boolean
 *         }
 *        }
 *      }
 */

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "copilot" is now active!');
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "FIT4003Copilot@gmail.com", // generated ethereal user
      pass: "dhavujlgyeffmtwu", // generated ethereal password
    },
  });

  // Set UserID
  if (!context.workspaceState.get("userId")) {
    context.workspaceState.update("userId", userId);
  }

  var userId = context.workspaceState.get("userId");
  console.log("User ID: " + userId);
  // update userId in currentFile
  currentFile.userId = userId;
  currentFile.changes = {};

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "copilot.copilotPlugin",
    function () {
      // Display a message box to the user
      vscode.workspace.onDidChangeTextDocument((e) => {
        // current editor
        const editor = vscode.window.activeTextEditor;

        // get the document name and add it into currentFile dict
        currentFile.fileName = editor.document.fileName;

        const content = e.contentChanges[0];
        var detectText = content.text;
        const keys = convertKeys(detectText);

        // check whether changes dict is empty that means file has not been edited before
        if (Object.keys(currentFile.changes).length === 0) {
          currentChange = {
            prefix: "",
            codesuggested: "",
            acceptedTime: "",
            editedCodeSnippets: "",
            accepted: false,
            edited: false,
          };
        }

        // initiate variables
        var textIsCopied = false;

        // get current time in milliseconds
        var time = new Date().getTime();

        // if the file is accepted, check whether the time is within 60 seconds
        if (currentChange.accepted && currentChange.acceptedTime !== null) {
          if (time - currentChange.acceptedTime > 60000) {
            console.log("time is up: Edit will not be counted");
            // currentChange.accepted = false;
            // currentChange.acceptedTime = null;
          }
        }

        // detect whether users have paste line(s) of code
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

              //get cursor position
              var cursor_position = editor.selection.active;

              // create new range
              newRange = newRange.with(content.range.end, cursor_position);

              // get the text of the new range and update current file's codeSuggestion
              currentChange.codesuggested = editor.document.getText(newRange);

              // get the prefix text by creating  a new position based by getting line of the content range end and the start of the newRange
              var prefixPosition = new vscode.Position(
                content.range.end.line,
                0
              );
              newRangeWPrefix = newRange.with(prefixPosition, newRange.start);
              // get the text based on the newRangeWPrefix and update currentChange's editedCodeSnippets
              var newTextWPrefix = editor.document.getText(newRangeWPrefix);
              currentChange.prefix = newTextWPrefix;

              // reset edited variable
              currentChange.edited = false;
              currentChange.accepted = true;
              currentChange.editedCodeSnippets = "";

              // get accepted time
              currentChange.acceptedTime = new Date().getTime();

              // stringify the range
              var rangeString = JSON.stringify(newRange);
              console.log(rangeString);
              // update currenFile changes with the new currentChange
              currentFile.changes[rangeString] = currentChange;
              console.log(currentFile.changes);
            } else if (
              currentChange.edited ||
              (currentChange.accepted && !documentIsEmpty)
            ) {
              // detect whether user has accepted a code suggestion within 60 seconds
              // get current position
              current_cursor_position = getCursorPosition(editor);

              // Check if this is the edit made before was a copilot edit (aka within the range).
              if (newRange.contains(current_cursor_position)) {
                // only increment the edit counter once per edit
                if (!currentChange.edited) {
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
                }

                // get text from range and update currentChange's editedCodeSnippets
                var edittedCodeSuggestion = editor.document.getText(newRange);
                console.log(edittedCodeSuggestion);
                currentChange.editedCodeSnippets = edittedCodeSuggestion;
                // edited variable set to true to make sure the edit is only counted once
                currentChange.edited = true;
                // reset accepted variable to accept new code suggestion
                currentChange.accepted = false;

                // stringify the range
                var rangeString = JSON.stringify(newRange);
                console.log(rangeString);
                // update currenFile changes with the new currentChange
                currentFile.changes[rangeString] = currentChange;
                console.log(currentFile.changes);
              }
            }
          });
      });

      // Detect when document is closed
      vscode.workspace.onDidCloseTextDocument((e) => {
        // stringified currentFile into json format
        // add docCloseTime to currentFile
        currentFile.docCloseTime = new Date().getTime();
        console.log(currentFile);
        var json = JSON.stringify(currentFile);
        console.log(json);

        // send mail with defined transport object
        let emailMessage = {
          from: '"FIT4003 Group 22" <foo@example.com>', // sender address
          to: "FIT4003Copilot@gmail.com", // list of receivers
          subject: "IDE plugin data", // Subject line
          text:
            `User ID: ${context.workspaceState.get("userId")}
          Total suggestions accepted: ${context.workspaceState.get(
            "numberOfAccepted"
          )}
          Total suggestions edited: ${context.workspaceState.get(
            "numberOfEdited"
          )}` +
            // send current file json as text in a new line
            "\n" +
            json,
          // plain text body
        };

        // remove object with docName as key from files
        // reset currentFile
        currentFile.fileName = "";
        currentFile.changes = {};
        currentFile.docCloseTime = null;

        // send mail
        transporter.sendMail(emailMessage, function (err, data) {
          if (err) {
            console.log("Error " + err);
          } else {
            console.log("Email sent successfully");
          }
        });
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
