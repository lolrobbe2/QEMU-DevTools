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
          vscode.Uri.joinPath(this.context.extensionUri, "dist"),
        ],
      },
    );

    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.js"),
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
    html,
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    #screen {
      width: 100%;
      height: 100%;
      background: #000;
    }
  </style>
</head>
<body>
  <div id="screen"></div>
  <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }
}