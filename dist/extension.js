"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));

// src/qemu-manager.ts
var import_node_child_process = require("node:child_process");
var QemuManager = class {
  static ResolveExecutables() {
    switch (process.platform) {
      case "win32":
        return this.ResolveExecutablesWindows();
      case "linux":
        return this.ResolveExecutablesLinux();
      case "darwin":
        return this.ResolveExecutablesMacOS();
      default:
        return [];
    }
  }
  static ResolveExecutablesWindows() {
    try {
      const output = (0, import_node_child_process.execFileSync)("where.exe", ["qemu-system-*.exe"], {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "ignore"]
      });
      return output.split(/\r?\n/).filter(Boolean).map((filePath) => {
        const fullPath = filePath.trim();
        const fileName = fullPath.split(/[\\/]/).pop() ?? "";
        const match = fileName.match(/^qemu-system-(.+?)(w)?\.exe$/i);
        if (!match) {
          return void 0;
        }
        const arch = match[1];
        const isWindowsGui = Boolean(match[2]);
        return {
          path: fullPath,
          arch: arch.replace(/el$/i, ""),
          type: isWindowsGui ? 2 /* WindowsGui */ : 1 /* Console */,
          endianness: /el$/i.test(arch) ? 2 /* LittleEndian */ : 1 /* BigEndian */
        };
      }).filter(
        (executable) => executable !== void 0
      );
    } catch {
      return [];
    }
  }
  static ResolveExecutablesLinux() {
    return [];
  }
  static ResolveExecutablesMacOS() {
    return [];
  }
};

// src/extension.ts
function activate(context) {
  console.log('Congratulations, your extension "qemu-devtools" is now active!');
  const disposable = vscode.commands.registerCommand("qemu-devtools.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from QEMU DevTools!");
  });
  let executables = QemuManager.ResolveExecutables();
  context.subscriptions.push(disposable);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
