// Start MailDev for the CodePeat dev stack, or reuse an already-running instance.
// MailDev binds SMTP :1025 and its web UI :8887; launching a second one crashes with
// EADDRINUSE, so we only start it when the SMTP port is free.
import {spawn} from "node:child_process";
import {existsSync} from "node:fs";
import {connect} from "node:net";
import {fileURLToPath} from "node:url";

const SMTP_PORT = 1025;
const WEB_UI = "http://localhost:8887";
const MAILDEV_BIN = fileURLToPath(new URL("../node_modules/.bin/maildev", import.meta.url));

function isMaildevRunning() {
    return new Promise((resolve) => {
        const socket = connect(SMTP_PORT, "127.0.0.1");
        socket.setTimeout(800);
        socket.once("connect", () => { socket.destroy(); resolve(true); });
        socket.once("error", () => resolve(false));
        socket.once("timeout", () => { socket.destroy(); resolve(false); });
    });
}

if (await isMaildevRunning()) {
    console.log(`MailDev läuft bereits – wird wiederverwendet (${WEB_UI}).`);
    // Stay alive so concurrently keeps the pane, and stop cleanly on Ctrl+C.
    const keepAlive = setInterval(() => {}, 1 << 30);
    const stop = () => { clearInterval(keepAlive); process.exit(0); };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
} else {
    const bin = existsSync(MAILDEV_BIN) ? MAILDEV_BIN : "maildev";
    const maildev = spawn(bin, ["-s", String(SMTP_PORT), "-w", "8887"], {stdio: "inherit", shell: bin === "maildev"});
    maildev.on("exit", (code) => process.exit(code ?? 0));
    process.on("SIGINT", () => maildev.kill("SIGINT"));
    process.on("SIGTERM", () => maildev.kill("SIGTERM"));
}
