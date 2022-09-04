// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
let cursor_position1 = 0;
let cursor_position2 = 0;
let cursor_position_char1 = 0;
let cursor_position_char2 = 0;
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
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      //vscode.window.showInformationMessage("Hello World from copilot!");
      vscode.workspace.onDidChangeTextDocument((e) => {
        // current editor
        const editor = vscode.window.activeTextEditor;
        const key = e.contentChanges[0].text;
        const keys = convertKeys(key);
        console.log(keys);
        console.log(e.contentChanges[0]);
        //current_cursor = editor.selection.active;
        if (key.length > 20) {
          console.log("COPILOT HAS BEEN USED!");
          // If the user has used copilot, then save the cursor previous position. top limit

          cursor_position1 = editor.selection.active;
          console.log("Position 1 cursor: ", cursor_position1);
        } else {
          // check if there is no selection
          if (editor.selection.isEmpty) {
            // Check if this is the edit made before was a copilot edit (aka within the range)
            if (
              cursor_position1.line < getCursorPosition(editor).line &&
              cursor_position2.line > getCursorPosition(editor).line
            ) {
              console.log("COPILOT HAS BEEN EDITED!");
              console.log("Position 1 cursor: ", cursor_position1);
              console.log("Position 2 cursor: ", cursor_position2);
            } else {
              // the Position object gives you the line and character where the cursor is
              cursor_position2 = getCursorPosition(editor);
              console.log("Position 2 cursor: ", cursor_position2);
            }
          }
        }
        // A edit has occurred if the user types within the range to the upper suggested text or lower suggested text
        //cursor_position2 = editor.selection.active;

        //vscode.window.showInformationMessage(keys);
        //vscode.window.showInformationMessage("Hello World from copilot!");
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
