import { QemuEndianness, QemuExecutable } from "./qemu-manager";
import * as fs from "node:fs/promises";
import * as vscode from "vscode";
import { QemuDebugConfiguration, QemuDevice } from "./debug/configuration";
import { QemuDrive } from "./qemu-drive";
export interface QemuSymbolFile {
  path: string;
  offset?: string | number;
}
export class QemuHost implements vscode.Disposable {
  private taskExecution: vscode.TaskExecution | undefined;
  private disposed: boolean = false;

  public constructor(
    public readonly executable: QemuExecutable,
    private readonly configuration: QemuDebugConfiguration,
    private readonly gdbPort: number,
    private readonly displayPort: number
  ) {}

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;

    this.taskExecution?.terminate();
    this.taskExecution = undefined;
  }
  public async Run(renderInWebview: boolean = false): Promise<void> {
    if (this.disposed) {
      throw new Error("Cannot run a disposed QemuHost.");
    }

    if (this.taskExecution !== undefined) {
      throw new Error("QEMU is already running.");
    }

    const args: string[] = [
      "-d",
      "guest_errors",
      "-serial",
      "stdio",
      "-gdb",
      `tcp:${this.configuration.debuggerServerAddress ?? `localhost:${this.gdbPort}`}`,
      "-S",
    ];
    if (renderInWebview) {
      args.push("-vnc", `127.0.0.1:0,websocket=${this.displayPort}`);
    }
    args.push(...this.BuildDriveArguments(this.configuration.drives ?? []));
    args.push(...this.BuildDeviceArguments(this.configuration.devices ?? []));
    
    const task = new vscode.Task(
      { type: "qemu", executable: this.executable.path },
      vscode.TaskScope.Workspace,
      `QEMU (${this.executable.arch})`,
      "QEMU DevTools",
      new vscode.ProcessExecution(this.executable.path, args),
      [],
    );

    task.presentationOptions = {
      reveal: vscode.TaskRevealKind.Always,
      panel: vscode.TaskPanelKind.Dedicated,
      clear: true,
    };
    const execution: vscode.TaskExecution =
      await vscode.tasks.executeTask(task);

    if (this.disposed) {
      execution.terminate();
      return;
    }

    this.taskExecution = execution;
  }
  private BuildDriveArguments(drives: QemuDrive[]): string[] {
    const args: string[] = [];

    for (const drive of drives) {
      const options: string[] = [
        `if=${drive.interface}`,
        `format=${drive.format}`,
      ];

      if (drive.readonly) {
        options.push("readonly=on");
      }

      if (drive.fat) {
        options.push(`file=fat:rw:${drive.file}`);
      } else {
        options.push(`file=${drive.file}`);
      }

      args.push("-drive", options.join(","));
    }

    return args;
  }
  private BuildDeviceArguments(
    devices: QemuDevice[],
  ): string[] {
    const args: string[] = [];

    for (const device of devices) {
      const options: string[] = [device.driver];

      for (const [key, value] of Object.entries(device.properties ?? {})) {
        let formattedValue: string;

        if (typeof value === "boolean") {
          formattedValue = value ? "on" : "off";
        } else {
          formattedValue = String(value);
        }

        // QEMU requires commas inside option values to be doubled.
        formattedValue = formattedValue.replace(/,/g, ",,");

        options.push(`${key}=${formattedValue}`);
      }

      args.push("-device", options.join(","));
    }
    return args;
  }
}
