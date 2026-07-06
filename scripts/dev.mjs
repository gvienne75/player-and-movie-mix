import { execSync, spawn } from "child_process";

// Find and kill process on port 5173 / 3000
for (const port of [5173, 3000]) {
  try {
    const out = execSync("netstat -aon").toString();
    const lines = out.split("\n").filter((l) => l.includes(`:${port} `) && l.includes("LISTENING"));
    for (const line of lines) {
      const pid = line.trim().split(/\s+/).at(-1);
      if (pid && !isNaN(Number(pid))) execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    }
  } catch (_) {}
}
await new Promise((r) => setTimeout(r, 600));

// vercel dev serves both the Vite SPA and the api/ serverless functions
const proc = spawn("vercel", ["dev", "--listen", "5173"], { stdio: "inherit", shell: true });
proc.on("exit", (code) => process.exit(code ?? 0));
