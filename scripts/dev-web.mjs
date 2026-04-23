import { execSync, spawn } from "node:child_process";
import { resolve } from "node:path";

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

function run(command, args, cwd) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: process.env,
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
  const tailwindBin = resolve(binDir, "tailwindcss");
  const nextBin = resolve(binDir, "next");

  killPort3000();

  await run(tailwindBin, ["-c", "tailwind.config.js", "-i", "./src/app/globals.css", "-o", "./src/app/tailwind.generated.css"], webDir);

  const port = process.env.PORT || "3000";
  await run(nextBin, ["dev", "-p", port], webDir);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
