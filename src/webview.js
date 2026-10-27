import RFB from "@novnc/novnc";

const screen = document.getElementById("screen");
const port = screen.getAttribute("port");
if (!screen) {
  throw new Error('Element "#screen" not found');
}

const rfb = new RFB(screen, `ws://127.0.0.1:${port}`);

rfb.scaleViewport = true;
rfb.resizeSession = false;
rfb.viewOnly = false;

rfb.addEventListener("connect", () => {
  console.log("Connected to QEMU display");
});

rfb.addEventListener("disconnect", (event) => {
  console.log("QEMU display disconnected", event.detail);
});

rfb.addEventListener("credentialsrequired", () => {
  console.error("VNC authentication required");
});