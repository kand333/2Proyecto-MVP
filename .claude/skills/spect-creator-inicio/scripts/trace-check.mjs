// Checks traceability across docs/spec.md, docs/task.md and docs/decision-log.md.
// Usage: node trace-check.mjs [docsDir]          -> report, exit 1 if errors
//        node trace-check.mjs [docsDir] --next   -> also prints the next eligible task
// Formats are defined in ../references/templates.md. No dependencies.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const WS_DEF = /^#{2,4}\s+(WS-\d{2})\b/;
const RF_DEF = /^\s*-\s+\*\*(RF-\d{2})\*\*\s*\(([^)]*)\)/;
const DEC_DEF = /^#{2,4}\s+(DEC-\d{3})\b/;
const TASK_DEF = /^-\s+\[( |x|X)\]\s+\*\*(T\d{3})\*\*\s+(.*?)\s*\(([^)]*)\)\s*$/;
const TASK_FIELD = /^\s+-\s+(deps|done|verify):\s*(.*)$/;
const STATUS = /^>\s*Estado:\s*(SHIP|BLOCK)\b/m;
const PENDING = "[PENDIENTE";

const ids = (text, prefix) => text.match(new RegExp(`${prefix}-?\\d{2,3}`, "g")) ?? [];

function readLines(path) {
  return existsSync(path) ? readFileSync(path, "utf8").split(/\r?\n/) : null;
}

export function check(docsDir) {
  const errors = [];
  const warnings = [];
  const err = (file, line, msg) => errors.push(`${file}:${line} ${msg}`);
  const warn = (file, line, msg) => warnings.push(`${file}:${line} ${msg}`);

  const spec = readLines(join(docsDir, "spec.md"));
  const tasks = readLines(join(docsDir, "task.md"));
  const decisions = readLines(join(docsDir, "decision-log.md"));
  const plan = readLines(join(docsDir, "plan.md"));

  if (!spec) err("spec.md", 0, "missing file");
  if (!tasks) err("task.md", 0, "missing file");
  if (!spec || !tasks) return { errors, warnings, status: null, next: null, progress: null };

  // Definitions
  const ws = new Map();
  const rf = new Map();
  const dec = new Map();
  const define = (map, id, file, line, extra = {}) => {
    if (map.has(id)) err(file, line, `${id} defined twice (first at line ${map.get(id).line})`);
    else map.set(id, { line, ...extra });
  };

  spec.forEach((text, i) => {
    const w = text.match(WS_DEF);
    if (w) define(ws, w[1], "spec.md", i + 1);
    const r = text.match(RF_DEF);
    if (r) define(rf, r[1], "spec.md", i + 1, { ws: ids(r[2], "WS") });
  });

  (decisions ?? []).forEach((text, i) => {
    const d = text.match(DEC_DEF);
    if (d) define(dec, d[1], "decision-log.md", i + 1, { body: [] });
  });
  // Attach each DEC body to check it states an impact.
  if (decisions) {
    let current = null;
    decisions.forEach((text) => {
      const d = text.match(DEC_DEF);
      if (d) current = dec.get(d[1]);
      else if (current) current.body.push(text);
    });
    for (const [id, d] of dec) {
      if (!d.body.some((l) => /impacto/i.test(l))) err("decision-log.md", d.line, `${id} has no "Impacto"`);
    }
  }

  // Tasks
  const taskMap = new Map();
  let current = null;
  tasks.forEach((text, i) => {
    const t = text.match(TASK_DEF);
    if (t) {
      const [, mark, id, title, meta] = t;
      if (taskMap.has(id)) err("task.md", i + 1, `${id} defined twice`);
      current = {
        id,
        title,
        line: i + 1,
        done: mark !== " ",
        ws: ids(meta, "WS"),
        rf: ids(meta, "RF"),
        size: meta.match(/\b(S|M|L|XL)\b/)?.[1] ?? null,
        deps: [],
        fields: new Set(),
        pending: text.includes(PENDING),
      };
      taskMap.set(id, current);
      return;
    }
    if (/^\S/.test(text)) current = null;
    if (!current) return;
    const f = text.match(TASK_FIELD);
    if (f) {
      current.fields.add(f[1]);
      if (f[1] === "deps") current.deps = ids(f[2], "T");
    }
    if (text.includes(PENDING)) current.pending = true;
  });

  // An empty chain usually means the docs use another format: never report it as OK.
  if (ws.size === 0) err("spec.md", 0, "no WS found (expected `### WS-01 · …`)");
  if (rf.size === 0) err("spec.md", 0, "no RF found (expected `- **RF-01** (WS-01) …`)");
  if (taskMap.size === 0) err("task.md", 0, "no tasks found (expected `- [ ] **T001** … (WS-01 · RF-01 · S)`)");

  // RF -> WS
  for (const [id, r] of rf) {
    if (r.ws.length === 0) err("spec.md", r.line, `${id} cites no WS`);
    for (const w of r.ws) if (!ws.has(w)) err("spec.md", r.line, `${id} cites undefined ${w}`);
  }
  // WS without RF
  for (const [id, w] of ws) {
    if (![...rf.values()].some((r) => r.ws.includes(id))) err("spec.md", w.line, `${id} has no RF`);
  }

  // Tasks -> WS/RF/deps/fields
  for (const t of taskMap.values()) {
    if (t.ws.length === 0) err("task.md", t.line, `${t.id} cites no WS`);
    if (t.rf.length === 0) err("task.md", t.line, `${t.id} cites no RF`);
    for (const w of t.ws) if (!ws.has(w)) err("task.md", t.line, `${t.id} cites undefined ${w}`);
    for (const r of t.rf) if (!rf.has(r)) err("task.md", t.line, `${t.id} cites undefined ${r}`);
    for (const d of t.deps) if (!taskMap.has(d)) err("task.md", t.line, `${t.id} depends on undefined ${d}`);
    for (const field of ["done", "verify"]) {
      if (!t.fields.has(field)) err("task.md", t.line, `${t.id} has no "${field}:"`);
    }
    if (!t.size) err("task.md", t.line, `${t.id} has no size (S/M/L/XL)`);
    if (t.size === "XL") warn("task.md", t.line, `${t.id} is XL: split it so it fits one session/PR`);
  }

  // Repetition: same requirement or same task written twice under different IDs.
  const normalize = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const seen = new Map();
  const dupe = (file, line, key, id) => {
    if (!key) return;
    if (seen.has(key)) warn(file, line, `${id} repeats ${seen.get(key)}: merge them`);
    else seen.set(key, id);
  };
  spec.forEach((text, i) => {
    const r = text.match(RF_DEF);
    if (r) dupe("spec.md", i + 1, `rf:${normalize(text.slice(r[0].length))}`, r[1]);
  });
  for (const t of taskMap.values()) dupe("task.md", t.line, `task:${normalize(t.title)}`, t.id);

  // RF without task
  for (const [id, r] of rf) {
    if (![...taskMap.values()].some((t) => t.rf.includes(id))) err("spec.md", r.line, `${id} has no task`);
  }

  // Dependency cycles (DFS)
  const state = new Map();
  const visit = (id, path) => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "active") {
      err("task.md", taskMap.get(id).line, `dependency cycle: ${[...path, id].join(" -> ")}`);
      return;
    }
    state.set(id, "active");
    for (const d of taskMap.get(id).deps) if (taskMap.has(d)) visit(d, [...path, id]);
    state.set(id, "done");
  };
  for (const id of taskMap.keys()) visit(id, []);

  // DEC citations must exist
  const sources = [
    ["spec.md", spec],
    ["plan.md", plan],
    ["task.md", tasks],
  ];
  for (const [file, lines] of sources) {
    (lines ?? []).forEach((text, i) => {
      for (const d of ids(text, "DEC")) if (!dec.has(d)) err(file, i + 1, `cites undefined ${d}`);
    });
  }

  const status = spec.join("\n").match(STATUS)?.[1] ?? null;
  if (!status) warn("spec.md", 0, 'no "> Estado: SHIP|BLOCK" line');

  const all = [...taskMap.values()];
  const next =
    all.find(
      (t) => !t.done && !t.pending && t.deps.every((d) => taskMap.get(d)?.done),
    ) ?? null;
  const progress = { done: all.filter((t) => t.done).length, total: all.length };

  return { errors, warnings, status, next, progress };
}

function main() {
  const args = process.argv.slice(2);
  const wantNext = args.includes("--next");
  const dir = args.find((a) => !a.startsWith("--")) ?? "docs";
  const { errors, warnings, status, next, progress } = check(dir);

  for (const e of errors) console.log(`ERROR ${e}`);
  for (const w of warnings) console.log(`WARN  ${w}`);
  if (progress) console.log(`tasks: ${progress.done}/${progress.total} done · estado: ${status ?? "?"}`);
  console.log(errors.length ? `FAIL: ${errors.length} error(s)` : "OK");

  if (wantNext) {
    if (errors.length) console.log("NEXT: none (fix errors first)");
    else if (status !== "SHIP") console.log("NEXT: none (spec is not SHIP)");
    else if (!next) console.log("NEXT: none (all done or blocked by deps/[PENDIENTE])");
    else console.log(`NEXT: ${next.id} ${next.title} (line ${next.line})`);
  }
  process.exitCode = errors.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
