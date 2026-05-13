import { execSync, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Read PORT from apps/backend/.env so the frontend API base matches dev:full + custom backend ports. */
function readBackendPort(rootDir) {
  if (process.env.BACKEND_PORT) return process.env.BACKEND_PORT;
  const envPath = resolve(rootDir, "apps/backend/.env");
  if (!existsSync(envPath)) return "4000";
  try {
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const m = t.match(/^PORT\s*=\s*(\d+)\s*$/i);
      if (m) return m[1];
    }
  } catch {
    // ignore
  }
  return "4000";
}

function killPort3000() {
  try {
    const output = execSync("lsof -ti :3000", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (!output) return;

    const pids = output.split("\n").filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGKILL");
      } catch {
        // Ignore stale PIDs.
      }
    }
  } catch {
    // No process is listening on port 3000.
  }
}

function run(command, args, cwd, env = process.env) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env,
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });

    child.on("error", (err) => rejectPromise(err));
  });
}

async function main() {
  const rootDir = resolve(process.cwd());
  const webDir = resolve(rootDir, "apps/frontend");
  const binDir = resolve(rootDir, "node_modules/.bin");
  const isWindows = process.platform === "win32";
  const ext = isWindows ? ".cmd" : "";
  const tailwindBin = resolve(binDir, `tailwindcss${ext}`);
  const nextBin = resolve(binDir, `next${ext}`);

  killPort3000();

  await run(tailwindBin, ["-c", "tailwind.config.js", "-i", "./src/app/globals.css", "-o", "./src/app/tailwind.generated.css"], webDir);

  const port = process.env.PORT || "3000";
  const nextEnv = { ...process.env };
  if (!nextEnv.NEXT_PUBLIC_API_URL) {
    const backendPort = readBackendPort(rootDir);
    nextEnv.NEXT_PUBLIC_API_URL = `http://127.0.0.1:${backendPort}/api`;
  }
  await run(nextBin, ["dev", "-p", port], webDir, nextEnv);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
