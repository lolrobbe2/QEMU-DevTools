import * as vscode from "vscode";
import { QemuHost } from "../qemu-host";

export class QemuDebugSession implements vscode.Disposable {
    public constructor(
        public readonly session: vscode.DebugSession,
        private readonly qemuHost: QemuHost
    ) {}

    public dispose(): void {
        this.qemuHost.dispose();
    }
}