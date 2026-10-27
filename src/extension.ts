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
import { QemuDebugSession } from "./debug/session";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  
  const qemuDebugAdapterDescriptorFactory = new QemuDebugAdapterDescriptorFactory(context);
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider(
      "qemudbg",
      new QemuDebugConfigurationProvider(),
    ),
    vscode.debug.registerDebugAdapterDescriptorFactory(
      "qemudbg",
      qemuDebugAdapterDescriptorFactory,
    ),
    vscode.debug.onDidTerminateDebugSession((session: vscode.DebugSession) => {
        if (session.type === "qemudbg") {
          qemuDebugAdapterDescriptorFactory.disposeSession(session);
        }
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
