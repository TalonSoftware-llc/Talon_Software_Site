import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { composeSync } from "./docker.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
composeSync(["up", "-d", "--wait"], root);

const children = [
  spawn(process.execPath, ["oidc/server.mjs"], { cwd: root, stdio: "inherit" }),
  spawn(process.execPath, ["data-plane/server.mjs"], { cwd: root, stdio: "inherit" }),
  spawn("npm", ["run", "dev"], { cwd: join(root, "portal"), stdio: "inherit" }),
];

function stop() {
  for (const child of children) child.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
