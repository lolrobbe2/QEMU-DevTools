// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  QemuEndianness,
  QemuExecutable,
  QemuExecutableType,
  QemuManager,
} from "./qemu-manager";
import { QemuHost } from "./qemu-host";
import { QemuDisplay } from "./qemu-display";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "qemu-devtools" is now active!');
  const display = new QemuDisplay(context);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "qemu-devtools.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from QEMU DevTools!");
    },
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("qemu-devtools.showDisplay", () => {
      display.Show();
    }),
  );
  const executable: QemuExecutable = QemuManager.GetExecutable(
    "x86_64",
    QemuEndianness.BigEndian,
    QemuExecutableType.Console,
  )!;
  const host = new QemuHost(executable);
  await host.Run(true);
  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
