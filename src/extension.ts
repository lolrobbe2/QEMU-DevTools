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
import { QemuDebugConfigurationProvider } from "./debug/provider";
import { QemuDebugAdapterDescriptorFactory } from "./debug/adapter";

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
  context.subscriptions.push(
    vscode.commands.registerCommand("qemu-devtools.showDisplay", () => {
      display.Show();
    }),
  );
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider(
      "qemudbg",
      new QemuDebugConfigurationProvider(),
    ),
    vscode.debug.registerDebugAdapterDescriptorFactory(
      "qemudbg",
      new QemuDebugAdapterDescriptorFactory(),
    ),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
