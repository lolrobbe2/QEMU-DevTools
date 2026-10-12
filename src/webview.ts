import RFB from "@novnc/novnc/core/rfb.js";


const screen = document.getElementById("screen")!;

const rfb = new RFB(
  screen,
  "ws://127.0.0.1:5700",
);

rfb.scaleViewport = true;
rfb.resizeSession = false;
rfb.viewOnly = false;

rfb.addEventListener("connect", () => {
  console.log("Connected to QEMU display");
});

rfb.addEventListener("disconnect", (event: CustomEvent) => {
  console.log("QEMU display disconnected", event.detail);
});

rfb.addEventListener("credentialsrequired", () => {
  console.error("VNC authentication required");
});