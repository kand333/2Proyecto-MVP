// Launches one Claude Code cloud session per night that implements the next block of docs/task.md.
// Run by the Windows scheduled task "Claude cloud night"; safe to run by hand.
// Usage: node scripts/cloud-night.mjs [--dry-run]
// Stops (and logs why) when the promo is over, it already ran today, the checkout is not on main,
// a previous cloud/* branch is still waiting on the remote, or the contract has no next task.
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Cloud session credits end 2026-11-05 04:59 GMT-3; after that the Actions night mode takes over.
const PROMO_END = new Date("2026-11-05T07:59:00Z");
const TASKS_PER_SESSION = 4;
const DOCS = ["spec.md", "plan.md", "task.md", "decision-log.md"];

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const logFile = join(tmpdir(), "cloud-night.log");
const today = new Date().toISOString().slice(0, 10);
const stamp = join(tmpdir(), `cloud-night-${today}`);

function log(message) {
  const line = `${new Date().toISOString()} ${dryRun ? "[dry-run] " : ""}${message}`;
  console.log(line);
  try {
    appendFileSync(logFile, `${line}\n`);
  } catch {
    // Logging must never stop the launcher.
  }
}

const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

async function nextTask() {
  const dir = mkdtempSync(join(tmpdir(), "cloud-night-docs-"));
  for (const file of DOCS) {
    try {
      writeFileSync(join(dir, file), git("show", `origin/main:docs/${file}`));
    } catch {
      // Optional docs (plan, decision-log) may not exist.
    }
  }
  const traceCheck = join(root, ".claude/skills/spect-creator-inicio/scripts/trace-check.mjs");
  const { check } = await import(pathToFileURL(traceCheck).href);
  return check(dir);
}

function prompt(branch, first) {
  return `Sesión nocturna automática (sin usuario).
1. Entorno: \`docker compose up -d --wait\` (Postgres en 5433 con app y app_test), luego \`npm run setup\` y \`npm ci\`. Si \`node --version\` es menor que 22.12, antepon \`/opt/node22/bin\` al PATH.
2. Crea la rama \`${branch}\` desde main.
3. Lee \`.claude/skills/spect-creator-inicio/SKILL.md\` y ejecuta su "Modo next" ${TASKS_PER_SESSION} veces seguidas (empieza por ${first}). Por cada tarea: su verify en verde, \`[x]\` en docs/task.md y un commit en inglés \`feat(ws-XX): T00X …\`.
4. Si una tarea necesita a un humano o no queda en verde, no la marques: detente y conserva las anteriores.
5. Al final, un único \`git push -u origin ${branch}\`. No abras PR ni hagas merge: el workflow cloud-merge lo hace si lint, typecheck, tests y trace-check pasan.
6. Termina con un resumen: tareas hechas, verificaciones y bloqueos.`;
}

async function main() {
  if (new Date() >= PROMO_END) return log("promo ended: nothing to do (the GitHub Actions night mode is back)");
  if (!dryRun && existsSync(stamp)) return log(`already launched today (${stamp})`);

  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  if (branch !== "main") return log(`checkout is on "${branch}", not main: claude --cloud clones the current branch`);

  git("fetch", "--quiet", "origin");
  const pending = git("ls-remote", "--heads", "origin", "cloud/*");
  if (pending) return log(`previous block not merged yet: ${pending.split(/\s+/).pop()}`);

  const { errors, status, next, progress } = await nextTask();
  if (errors.length) return log(`trace-check failed on origin/main: ${errors[0]}`);
  if (status !== "SHIP") return log(`spec is ${status ?? "without status"}, not SHIP`);
  if (!next) return log(`no unblocked task (${progress.done}/${progress.total} done)`);

  const cloudBranch = `cloud/${today.replaceAll("-", "")}`;
  const text = prompt(cloudBranch, next.id);
  if (dryRun) return log(`would launch ${cloudBranch} from ${next.id} (${progress.done}/${progress.total} done)\n${text}`);

  if (!process.stdout.isTTY) return log("claude --cloud needs an interactive terminal: run this from a console window (the scheduled task opens one)");

  // No shell: the multi-line prompt goes as a single argv entry (claude is a native executable).
  // stdio inherit: --cloud refuses to run without a TTY. The timeout only guards a hung CLI;
  // the session itself keeps running in the cloud.
  log(`launching ${cloudBranch} from ${next.id}`);
  const result = spawnSync("claude", ["--cloud", text], { cwd: root, stdio: "inherit", timeout: 10 * 60 * 1000 });
  if (result.error) return log(`could not run claude: ${result.error.message}`);
  log(`claude --cloud exit ${result.status ?? `signal ${result.signal}`}`);
  if (result.status === 0) writeFileSync(stamp, cloudBranch);
}

main().catch((error) => log(`launcher error: ${error instanceof Error ? error.message : String(error)}`));
