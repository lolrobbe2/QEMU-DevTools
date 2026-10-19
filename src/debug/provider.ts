import * as vscode from "vscode";
import { QemuDebugConfiguration, QemuSymbolFile } from "./configuration";
import LIEF from "node-lief";

export class QemuDebugConfigurationProvider
  implements vscode.DebugConfigurationProvider
{
  public resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    config: QemuDebugConfiguration,
  ): vscode.ProviderResult<vscode.DebugConfiguration> {
    config.request = "attach";
    config.target = config.debuggerServerAddress ?? "localhost:1234";
    return config;
  }
}
