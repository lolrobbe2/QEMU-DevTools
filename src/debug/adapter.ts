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
import { QemuDisplay } from "../qemu-display";

export class QemuDebugAdapterDescriptorFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  private readonly displayPortRange: [number, number] = [5700, 5730];
  private readonly reservedDisplayPorts: number[] = [];
  private readonly gdbPortRange: [number, number] = [6700, 6730];
  private readonly reservedGdbPorts: number[] = [];
  private readonly sessions: Map<string, QemuDebugSession> = new Map();
  private readonly displaySessions: Map<string, QemuDisplay> = new Map();
  public constructor(private readonly context: vscode.ExtensionContext) {
    const [displayStart, displayEnd] = this.displayPortRange;
    const [gdbStart, gdbEnd] = this.gdbPortRange;

    for (let port = displayStart; port <= displayEnd; port++) {
      this.reservedDisplayPorts.push(port);
    }

    for (let port = gdbStart; port <= gdbEnd; port++) {
      this.reservedGdbPorts.push(port);
    }
  }
  public async createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable | undefined,
  ): Promise<vscode.ProviderResult<vscode.DebugAdapterDescriptor>> {
    const config = session.configuration as QemuDebugConfiguration;
    const displayPort: number | undefined = this.reservedDisplayPorts.pop();
    const gdbPort: number | undefined = this.reservedGdbPorts.pop();
    /** we reserve a display port to avoid weird port related shenanigans! */
    if (displayPort === undefined || gdbPort === undefined) {
      //just to be safe we throw here :)
      throw new Error("no more reserved ports remaining");
    }
    const qemuDisplay: QemuDisplay | undefined = config.embbededDisplay === true
      ? new QemuDisplay(
          this.context,
          config.architeture ?? "x86_64",
          session,
          displayPort,
        )
      : undefined;
    const qemuHost: QemuHost = new QemuHost(
      QemuManager.GetExecutable(
        config.architeture ?? "x86_64",
        config.endianness ?? QemuEndianness.BigEndian,
        config.executableType ?? QemuExecutableType.Console,
      )!,
      config,
      gdbPort,
      displayPort,
    );
    await qemuHost.Run(false);
    /* if they want a display show it */
    if (qemuDisplay !== undefined) {
      qemuDisplay.Show();
      this.displaySessions.set(session.id, qemuDisplay);
    }

    const qemuSession: QemuDebugSession = new QemuDebugSession(
      session,
      qemuHost,
      displayPort,
      gdbPort,
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
  public disposeSession(session: vscode.DebugSession) {
    const qemuSession: QemuDebugSession | undefined = this.sessions.get(
      session.id,
    );
    const displaySession: QemuDisplay | undefined = this.displaySessions.get(
      session.id,
    );
    if (qemuSession === undefined) {
      return; //GET OUT!!
    }
    this.reservedDisplayPorts.push(qemuSession!.displayPort);
    this.reservedGdbPorts.push(qemuSession!.gdbPort);

    displaySession?.Dispose();
    qemuSession!.dispose();

    this.sessions.delete(qemuSession.session.id);
    this.displaySessions.delete(qemuSession.session.id);
  }
}
