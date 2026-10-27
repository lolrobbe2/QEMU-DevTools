import { execFileSync } from "node:child_process";
import { accessSync, constants, readdirSync, statSync } from "node:fs";
import * as path from "node:path";
export enum QemuExecutableType {
  Console = 1 << 0,
  WindowsGui = 1 << 1,
}

export enum QemuEndianness {
  BigEndian = 1 << 0,
  LittleEndian = 1 << 1,
}
export interface QemuExecutable {
  path: string;
  arch: string;
  type: QemuExecutableType;
  endianness: QemuEndianness;
}
export class QemuManager {
  public static GetExecutable(
    arch: string,
    endianness: QemuEndianness,
    type: QemuExecutableType,
  ): QemuExecutable | undefined {
    return this.ResolveExecutables().find(
      (executable) =>
        executable.arch.toLowerCase() === arch.toLowerCase() &&
        executable.endianness === endianness &&
        executable.type === type,
    );
  }
  public static ResolveExecutables(): QemuExecutable[] {
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
  private static ResolveExecutablesWindows(): QemuExecutable[] {
    try {
      const output = execFileSync("where.exe", ["qemu-system-*.exe"], {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "ignore"],
      });

      return output
        .split(/\r?\n/)
        .filter(Boolean)
        .map((filePath): QemuExecutable | undefined => {
          const fullPath = filePath.trim();
          const fileName = fullPath.split(/[\\/]/).pop() ?? "";
          const match = fileName.match(/^qemu-system-(.+?)(w)?\.exe$/i);

          if (!match) {
            return undefined;
          }

          const arch = match[1];
          const isWindowsGui = Boolean(match[2]);

          return {
            path: fullPath,
            arch: arch.replace(/el$/i, ""),
            type: isWindowsGui
              ? QemuExecutableType.WindowsGui
              : QemuExecutableType.Console,
            endianness: /el$/i.test(arch)
              ? QemuEndianness.LittleEndian
              : QemuEndianness.BigEndian,
          };
        })
        .filter(
          (executable): executable is QemuExecutable =>
            executable !== undefined,
        );
    } catch {
      return [];
    }
  }
  private static ResolveExecutablesLinux(): QemuExecutable[] {
    return this.ResolveExecutablesUnix([
      "/opt/homebrew/bin", /* Homebrew on Apple Silicon */
      "/usr/local/bin", /* Homebrew on Intel Macs */
      "/opt/local/bin", /* MacPorts*/
    ]);
  }

  private static ResolveExecutablesMacOS(): QemuExecutable[] {
    return this.ResolveExecutablesUnix([
      "/opt/homebrew/bin", /* Homebrew on Apple Silicon */
      "/usr/local/bin", /* Homebrew on Intel Macs */
      "/opt/local/bin", /* MacPorts*/
    ]);
  }

  private static ResolveExecutablesUnix(
    extraDirectories: string[] = [],
  ): QemuExecutable[] {
    const searchDirectories = [
      ...new Set([
        ...(process.env.PATH ?? "")
          .split(path.delimiter)
          .map((directory) => directory || process.cwd()),
        ...extraDirectories,
      ]),
    ];

    const seenPaths = new Set<string>();
    const executables: QemuExecutable[] = [];

    for (const directory of searchDirectories) {
      let entries: string[];

      try {
        entries = readdirSync(directory);
      } catch {
        continue;
      }

      for (const fileName of entries) {
        const match = fileName.match(/^qemu-system-(.+)$/i);

        if (!match) {
          continue;
        }

        const fullPath = path.resolve(directory, fileName);

        if (seenPaths.has(fullPath)) {
          continue;
        }

        try {
          if (!statSync(fullPath).isFile()) {
            continue;
          }

          accessSync(fullPath, constants.X_OK);
        } catch {
          continue;
        }

        seenPaths.add(fullPath);

        const arch = match[1];
        const isLittleEndian = /el$/i.test(arch);

        executables.push({
          path: fullPath,
          arch: arch.replace(/el$/i, ""),
          type: QemuExecutableType.Console,
          endianness: isLittleEndian
            ? QemuEndianness.LittleEndian
            : QemuEndianness.BigEndian,
        });
      }
    }

    return executables;
  }
}
