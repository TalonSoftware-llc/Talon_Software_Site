import { execFileSync, spawn } from "node:child_process";

export function dockerPrefix() {
  try {
    execFileSync("docker", ["info"], { stdio: "ignore" });
    return ["docker"];
  } catch {
    execFileSync("sudo", ["-n", "docker", "info"], { stdio: "ignore" });
    return ["sudo", "-n", "docker"];
  }
}

export function composeSync(args, cwd) {
  const prefix = dockerPrefix();
  execFileSync(prefix[0], [...prefix.slice(1), "compose", ...args], { cwd, stdio: "inherit" });
}

export function compose(args, cwd) {
  const prefix = dockerPrefix();
  return spawn(prefix[0], [...prefix.slice(1), "compose", ...args], { cwd, stdio: "inherit" });
}
