import { QemuEndianness, QemuExecutable } from "./qemu-manager";
import * as fs from "node:fs/promises";
import * as vscode from "vscode";
export interface QemuSymbolFile {
  path: string;
  offset?: string | number;
}
export class QemuHost {
  public constructor(
    public readonly executable: QemuExecutable,
    private readonly symbolFiles: QemuSymbolFile[] = [],
  ) {}
  public async Run(): Promise<void> {
    const task = new vscode.Task(
      { type: "qemu", executable: this.executable.path },
      vscode.TaskScope.Workspace,
      `QEMU (${this.executable.arch})`,
      "QEMU DevTools",
      new vscode.ProcessExecution(this.executable.path, []),
      [],
    );

    task.presentationOptions = {
      reveal: vscode.TaskRevealKind.Always,
      panel: vscode.TaskPanelKind.Dedicated,
      clear: true,
    };

    await vscode.tasks.executeTask(task);
  }
  public async ResolveSymbolCommands(): Promise<string[]> {
    return Promise.all(
      this.symbolFiles.map(async (symbol) => {
        const offset =
          symbol.offset ?? (await this.ReadElfEntryPoint(symbol.path));

        return `add-symbol-file "${symbol.path}" -o 0x${BigInt(offset).toString(16)}`;
      }),
    );
  }

  private async ReadElfEntryPoint(filePath: string): Promise<bigint> {
    const file = await fs.open(filePath, "r");

    try {
      const header = Buffer.alloc(64);
      const { bytesRead } = await file.read(header, 0, 64, 0);

      if (
        bytesRead < 52 ||
        header[0] !== 0x7f ||
        header[1] !== 0x45 ||
        header[2] !== 0x4c ||
        header[3] !== 0x46
      ) {
        throw new Error(`Invalid or truncated ELF file: ${filePath}`);
      }

      const elfClass = header[4]; // 1 = ELF32, 2 = ELF64
      const dataEncoding = header[5]; // 1 = little-endian, 2 = big-endian

      if (elfClass !== 1 && elfClass !== 2) {
        throw new Error(`Unsupported ELF class: ${elfClass}`);
      }

      if (dataEncoding !== 1 && dataEncoding !== 2) {
        throw new Error(`Unsupported ELF byte order: ${dataEncoding}`);
      }

      const elfEndianness =
        dataEncoding === 1
          ? QemuEndianness.LittleEndian
          : QemuEndianness.BigEndian;

      if (elfEndianness !== this.executable.endianness) {
        throw new Error(
          `ELF endianness mismatch for "${filePath}": ` +
            `expected ${QemuEndianness[this.executable.endianness]}, ` +
            `got ${QemuEndianness[elfEndianness]}`,
        );
      }

      const littleEndian = dataEncoding === 1;

      if (elfClass === 1) {
        return BigInt(
          littleEndian ? header.readUInt32LE(24) : header.readUInt32BE(24),
        );
      }

      if (bytesRead < 64) {
        throw new Error(`Truncated ELF64 header: ${filePath}`);
      }

      return littleEndian
        ? header.readBigUInt64LE(24)
        : header.readBigUInt64BE(24);
    } finally {
      await file.close();
    }
  }
}
