import * as vscode from "vscode";
import { QemuEndianness, QemuExecutableType } from "../qemu-manager";
import { QemuDrive } from "../qemu-drive";

export interface QemuSymbolFile {
  path: string;
  offset?: string | number;
}

export interface QemuDebugConfiguration extends vscode.DebugConfiguration {
  program: string;
  cwd?: string;
  name: string;
  architeture?: string;
  stopAtEntry?: boolean;
  debuggerServerAddress?: string;
  symbolFiles?: QemuSymbolFile[];
  executableType?: QemuExecutableType;
  endianness?: QemuEndianness;
  drives?: QemuDrive[];
  sourcePath?: string; 
}
