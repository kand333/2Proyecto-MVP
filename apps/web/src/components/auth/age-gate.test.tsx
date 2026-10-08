import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AgeGate, AgeGateDialog } from "./age-gate";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("AgeGateDialog", () => {
  it("is a labelled modal dialog that asks for the age", () => {
    const html = renderToStaticMarkup(<AgeGateDialog onConfirm={vi.fn()} />);
    expect(html).toMatch(/^<dialog aria-labelledby="age-gate-title" aria-describedby="age-gate-message"/);
    expect(html).toContain('id="age-gate-title"');
    expect(html).toContain("Solo para mayores de 18 años");
  });

  it("offers «Soy mayor de 18» as a button and «Soy menor» as a link to /age-restricted", () => {
    const html = renderToStaticMarkup(<AgeGateDialog onConfirm={vi.fn()} />);
    expect(html).toMatch(/<a [^>]*href="\/age-restricted"[^>]*>Soy menor<\/a>/);
    expect(html).toMatch(/<button type="button"[^>]*>Soy mayor de 18<\/button>/);
  });
});

describe("AgeGate", () => {
  it("renders nothing on the server, so adults who already answered never see it flash", () => {
    expect(renderToStaticMarkup(<AgeGate />)).toBe("");
  });
});
