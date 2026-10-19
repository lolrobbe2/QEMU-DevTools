export enum QemuDriveFormat {
  Raw = "raw",
  Qcow2 = "qcow2",
  Qed = " qed",
  Vdi = "vdi",
  Vhdx = "vhdx",
  Vmdk = "vmdk",
  Vpc = "vpc",
}
export interface QemuDrive {
  interface: string;
  format: QemuDriveFormat;
  file: string;
  readonly?: boolean;
  fat?: boolean;
}