import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

type Tokens = Record<string, string>;

function readTokens(block: string): Tokens {
  const tokens: Tokens = {};
  for (const [, name, value] of block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/gi)) tokens[name] = value;
  return tokens;
}

const lightBlock = css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)"));
const darkBlock = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"), css.indexOf("@theme inline"));
const modes = { light: readTokens(lightBlock), dark: readTokens(darkBlock) };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

// Pairs the UI actually draws; the ratios in docs/design.md come from this table.
const pairs: [string, string, number][] = [
  ["ink", "paper", 4.5],
  ["ink", "surface", 4.5],
  ["muted", "paper", 4.5],
  ["muted", "surface", 4.5],
  ["accent", "paper", 4.5],
  ["accent", "surface", 4.5],
  ["on-accent", "accent", 4.5],
  ["on-accent", "accent-hover", 4.5],
  ["on-highlight", "highlight", 4.5],
  // "Agotado" badge: paper text on an ink pill.
  ["paper", "ink", 4.5],
];

describe("design tokens", () => {
  for (const [mode, tokens] of Object.entries(modes)) {
    it(`${mode} mode defines every role`, () => {
      expect(Object.keys(tokens).sort()).toEqual(
        ["accent", "accent-hover", "highlight", "ink", "line", "muted", "on-accent", "on-highlight", "paper", "surface"].sort(),
      );
    });

    for (const [fg, bg, minimum] of pairs) {
      it(`${mode}: ${fg} on ${bg} meets WCAG AA`, () => {
        const ratio = contrast(tokens[fg], tokens[bg]);
        console.info(`contrast ${mode} ${fg}/${bg} ${ratio.toFixed(2)}`);
        expect(ratio).toBeGreaterThanOrEqual(minimum);
      });
    }
  }
});
