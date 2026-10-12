import * as vscode from "vscode";

export class QemuDisplay {
  private panel?: vscode.WebviewPanel;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public Show(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "qemuDisplay",
      "QEMU Display",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, "out"),
        ],
      },
    );

    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "out", "webview.js"),
    );

    this.panel.webview.html = this.GetHtml(scriptUri);

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private GetHtml(scriptUri: vscode.Uri): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; script-src ${this.panel!.webview.cspSource}; connect-src ws://127.0.0.1:*; style-src 'unsafe-inline';"
  >
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    html, body, #screen {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: #111;
    }
    #screen canvas {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="screen"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}