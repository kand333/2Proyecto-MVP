// Run: node --test .claude/skills/spect-creator-inicio/scripts/trace-check.test.mjs
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { check } from "./trace-check.mjs";

const SPEC = `# Spec
> Estado: SHIP

### WS-01 · Catálogo · M
- **RF-01** (WS-01) Listar productos. Dado un visitante, cuando abre /products, entonces ve 20 por página.
- **RF-02** (WS-01) Crear producto (ver DEC-001).
`;

const TASKS = `# Tareas
- [x] **T001** Esquema Zod de Product (WS-01 · RF-01,RF-02 · S)
  - deps: —
  - done: dado datos válidos, cuando parse, entonces ok
  - verify: \`npm test -w @portal/shared\`
- [ ] **T002** Endpoint admin (WS-01 · RF-02 · M)
  - deps: T001
  - done: dado un admin, cuando POST válido, entonces 201
  - verify: \`npm test -w @portal/api\`
- [ ] **T003** Listado público (WS-01 · RF-01 · M)
  - deps: T002
  - done: dado un visitante, cuando GET, entonces 200
  - verify: \`npm test -w @portal/api\`
`;

const DECISIONS = `# Decisiones
## DEC-001 · Precio en céntimos
- Impacto: WS-01, T001
`;

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "trace-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  return dir;
}

const base = { "spec.md": SPEC, "task.md": TASKS, "decision-log.md": DECISIONS };

test("valid docs pass and pick the next unblocked task", () => {
  const r = check(fixture(base));
  assert.deepEqual(r.errors, []);
  assert.equal(r.status, "SHIP");
  assert.equal(r.next.id, "T002");
  assert.deepEqual(r.progress, { done: 1, total: 3 });
});

test("missing files are errors", () => {
  const r = check(fixture({}));
  assert.equal(r.errors.length, 2);
});

test("docs in another format are not reported as OK", () => {
  const r = check(fixture({ "spec.md": "# Spec\n## RF1 algo\n", "task.md": "- [ ] T1 algo\n" }));
  for (const msg of ["no WS found", "no RF found", "no tasks found"]) {
    assert.ok(r.errors.some((e) => e.includes(msg)), msg);
  }
});

test("RF without task and WS without RF are reported", () => {
  const spec = `${SPEC}### WS-02 · Vacío · S\n- **RF-03** (WS-01) Sin tarea.\n`;
  const r = check(fixture({ ...base, "spec.md": spec }));
  assert.ok(r.errors.some((e) => e.includes("WS-02 has no RF")));
  assert.ok(r.errors.some((e) => e.includes("RF-03 has no task")));
});

test("undefined refs, missing fields and missing size are reported", () => {
  const tasks = `${TASKS}- [ ] **T004** Huérfana (RF-09 · deps)\n  - deps: T099\n`;
  const r = check(fixture({ ...base, "task.md": tasks }));
  for (const msg of ["T004 cites no WS", "undefined RF-09", "undefined T099", 'no "done:"', 'no "verify:"', "no size"]) {
    assert.ok(r.errors.some((e) => e.includes(msg)), msg);
  }
});

test("dependency cycles are reported", () => {
  const tasks = TASKS.replace("  - deps: —", "  - deps: T003");
  const r = check(fixture({ ...base, "task.md": tasks }));
  assert.ok(r.errors.some((e) => e.includes("dependency cycle")));
});

test("DEC must exist and state its impact", () => {
  const r1 = check(fixture({ ...base, "decision-log.md": "# Decisiones\n" }));
  assert.ok(r1.errors.some((e) => e.includes("undefined DEC-001")));
  const r2 = check(fixture({ ...base, "decision-log.md": "## DEC-001 · X\n- Problema: y\n" }));
  assert.ok(r2.errors.some((e) => e.includes('DEC-001 has no "Impacto"')));
});

test("[PENDIENTE] tasks are skipped by next", () => {
  const tasks = TASKS.replace("Endpoint admin", "Endpoint admin [PENDIENTE: rol]");
  const r = check(fixture({ ...base, "task.md": tasks }));
  assert.equal(r.next, null);
});

test("XL tasks only warn", () => {
  const r = check(fixture({ ...base, "task.md": TASKS.replace("RF-01 · M)", "RF-01 · XL)") }));
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => w.includes("T003 is XL")));
});
