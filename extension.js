// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const { ConsoleReporter } = require("@vscode/test-electron");
const { isConditionalExpression } = require("typescript");
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
      
      // Display a message box to the user
      vscode.workspace.onDidChangeTextDocument((e) => { 

       // current editor
        const editor = vscode.window.activeTextEditor;
        
        // initiate variables
        var textIsCopied = false;   

        // check whether the filename is .py
        if (editor.document.languageId === "python") {   
          // get current time in milliseconds
          var time = new Date().getTime();
          //console.log(time);

          // detect whether users have paste line(s) of code
          const content = e.contentChanges[0];
          //console.log(content.range);
          var detectText = content.text;
          const keys = convertKeys(detectText);

          vscode.env.clipboard.readText().then((text) => {
            // check whether the clipboard is empty
              if (text !== "") {
                // compare detectText and clipboard
                if (detectText === text) {
                  textIsCopied = true;
                  console.log("Inside ", textIsCopied);
                }
              }
          });

          console.log("Outside", textIsCopied);
          
          // detect whether user has accepted code suggestion
          if(detectText.length > 20 && !textIsCopied){
              console.log("COPILOT SUGGESTION ACCEPTED");
              console.log(content.range.end);

              // get cursor position
              cursor_position1 = editor.selection.active;
              console.log("Position 1 cursor: ", cursor_position1);
          // detect whether user has edited code suggestion within 60 seconds
          }else{
            //get the start and end range of the cursor then use contain method to check whether the current position is within
            



            if (editor.selection.isEmpty) {
              current_cursor_position = getCursorPosition(editor).line;
              // Check if this is the edit made before was a copilot edit (aka within the range)
              if (cursor_position1.line < current_cursor_position && cursor_position2.line > current_cursor_position) {
                console.log("COPILOT HAS BEEN EDITED!");
                //console.log("Position 1 cursor: ", cursor_position1);
                //console.log("Position 2 cursor: ", cursor_position2);
              } else {
                // the Position object gives you the line and character where the cursor is
                cursor_position2 = getCursorPosition(editor);
                //console.log("Position 2 cursor: ", cursor_position2);
              }
            }
          }
      }
        

        // // current cursor position
        // var current_cursor = editor.selection.active;

        // // Get text that was inserted in the window
        // const key = e.contentChanges[0].text;
        // const content = e.contentChanges[0];
        // console.log(e.contentChanges[0]);

        // console.log("Start", content.range.start);
        // console.log("End", content.range.end);
        // console.log("current_cursor", current_cursor);


        // // translating text to capture special characters such as TAB, ENTER, SPACE 
        // const keys = convertKeys(key);

        // if (key.length > 20) {
        //   // detect whether there are multiple new lines in the text 
        //   console.log("COPILOT HAS BEEN USED!");
        //   // If the user has used copilot, then save the cursor previous position. top limit
        //   cursor_position1 = editor.selection.active;
        //   console.log("Position 1 cursor: ", cursor_position1);
        // } else {
        //   // check if there is no selection
        //   if (editor.selection.isEmpty) {
        //     // Check if this is the edit made before was a copilot edit (aka within the range)
        //     if (
        //       cursor_position1.line < getCursorPosition(editor).line &&
        //       cursor_position2.line > getCursorPosition(editor).line
        //     ) {
        //       console.log("COPILOT HAS BEEN EDITED!");
        //       console.log("Position 1 cursor: ", cursor_position1);
        //       console.log("Position 2 cursor: ", cursor_position2);
        //     } else {
        //       // the Position object gives you the line and character where the cursor is
        //       cursor_position2 = getCursorPosition(editor);
        //       console.log("Position 2 cursor: ", cursor_position2);
        //     }
        //   }
        // }
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
