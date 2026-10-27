# qemu-devtools README

## Features

- qemu executable detection

## QEMU Debug

The **QEMU Debug** configuration allows you to debug C and C++ applications running in a QEMU virtual machine. It supports configurable target architectures, GDB connections, symbol files, virtual drives, and custom devices.

### Configuration

Create a `launch.json` file in your `.vscode` folder and configure the debugger using the following properties.

| Property | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | Required | Name of the debug configuration. |
| `program` | `string` | Required | Path to the executable being debugged. |
| `cwd` | `string` | `${workspaceFolder}` | Working directory for the debug session. |
| `architeture` | `string` | `x86_64` | Target architecture. |
| `stopAtEntry` | `boolean` | — | Stop execution at the entry point. |
| `debuggerServerAddress` | `string` | `localhost:1234` | Address of the debugger server. |
| `executableType` | `number` | `1` | Executable type: `1` for console, `2` for Windows GUI. |
| `endianness` | `number` | `2` | Target byte order: `1` for big-endian, `2` for little-endian. |
| `symbolFiles` | `array` | `[]` | Additional ELF symbol files to load. |
| `sourcePath` | `string` | `${workspaceFolder}` | Local source path for GDB source mapping. |
| `embbededDisplay` | `boolean` | — | Render QEMU inside a VS Code tab when enabled. |
| `drives` | `array` | `[]` | Virtual drives to attach to the VM. |
| `devices` | `array` | — | Additional QEMU devices to create. |

### Example Configuration

A minimal configuration for debugging a C or C++ executable:

```json
{
    "name": "QEMU Debug",
    "type": "qemudbg",
    "request": "launch",
    "program": "${workspaceFolder}/build/kernel.elf",
    "cwd": "${workspaceFolder}",
    "architeture": "x86_64",
    "stopAtEntry": true,
    "debuggerServerAddress": "localhost:1234",
    "embbededDisplay": false
}
```

### Symbol Files

The `symbolFiles` property allows additional ELF symbol files to be loaded. Each entry requires a `path` and optionally accepts an `offset` for symbol relocation.

```json
"symbolFiles": [
    {
        "path": "${workspaceFolder}/build/kernel.elf",
        "offset": "0x100000"
    }
]
```

If `offset` is omitted, the ELF entry point is used.

### Virtual Drives

Use `drives` to attach disk images or FAT directories to the virtual machine.

Each drive requires:

- `interface`: Drive interface, such as `virtio`, `ide`, or `scsi`.
- `format`: Image format, such as `raw` or `qcow2`.
- `file`: Path to the disk image or FAT directory.

Optional properties:

- `readonly`: Attach the drive as read-only.
- `fat`: Treat the specified directory as a FAT drive.

### Custom Devices

Use `devices` to create additional QEMU devices.

Each device requires a `driver` and optionally accepts device-specific `properties`.

```json
"devices": [
    {
        "driver": "virtio-net-pci",
        "properties": {
            "disable-legacy": true
        }
    }
]
```

### Initial Configuration

The extension provides a default configuration:

```json
{
    "name": "QEMU Debug",
    "type": "qemudbg",
    "request": "launch",
    "embbededDisplay": false
}
```

Add the `program` property before starting a debugging session, as it is required.

---



**Enjoy!**
