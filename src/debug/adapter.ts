import * as vscode from "vscode";
import { spawn, ChildProcess } from "child_process";
import { QemuDebugConfiguration } from "./configuration";
import { QemuHost } from "../qemu-host";
import {
  QemuEndianness,
  QemuExecutableType,
  QemuManager,
} from "../qemu-manager";
import { QemuDebugSession } from "./session";
import LIEF from "node-lief";

export class QemuDebugAdapterDescriptorFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  private readonly sessions: Map<string, QemuDebugSession> = new Map();

  public async createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable | undefined,
  ): Promise<vscode.ProviderResult<vscode.DebugAdapterDescriptor>> {
    const config = session.configuration as QemuDebugConfiguration;

    const qemuHost: QemuHost = new QemuHost(
      QemuManager.GetExecutable(
        config.architeture ?? "x86_64",
        config.endianness ?? QemuEndianness.BigEndian,
        config.executableType ?? QemuExecutableType.Console,
      )!,
      config,
    );
    await qemuHost.Run(false);
    const qemuSession: QemuDebugSession = new QemuDebugSession(
      session,
      qemuHost,
    );

    this.sessions.set(session.id, qemuSession);
    const gdbArgs: string[] = [];
    for (const symbolFile of config.symbolFiles ?? []) {
      const path = symbolFile.path.replace(/\\/g, "/");

      const args = [`add-symbol-file "${path}"`];

      if (symbolFile.offset !== undefined) {
        args[0] = `add-symbol-file "${path}" -o ${symbolFile.offset}`;
      }

      gdbArgs.push("-ex", args[0]);
    }
    gdbArgs.push(
      "-ex",
      `set substitute-path . "${(config.sourcePath ?? config.cwd!).replace(/\\/g, "/")}"`,
    );

    gdbArgs.push("--interpreter=dap");
    return new vscode.DebugAdapterExecutable(config.gdbPath ?? "gdb", gdbArgs, {
      cwd: config.cwd,
    });
  }
  public disposeSession(session :vscode.DebugSession){
    this.sessions.get(session.id)?.dispose();
  }
}
