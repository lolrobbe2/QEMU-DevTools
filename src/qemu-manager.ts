import { execFileSync } from "node:child_process";
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
    // TODO: Implement Linux executable discovery.
    return [];
  }

  private static ResolveExecutablesMacOS(): QemuExecutable[] {
    // TODO: Implement macOS executable discovery.
    return [];
  }
}
