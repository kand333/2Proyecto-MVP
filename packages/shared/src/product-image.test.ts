import { describe, expect, it } from "vitest";
import { detectImageType } from "./product-image";

const bytes = (...values: number[]) => new Uint8Array([...values, ...Array(16).fill(0)]);

describe("detectImageType", () => {
  it("recognizes JPEG, PNG and WebP by their first bytes", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(detectImageType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))).toBe("image/webp");
  });

  it("rejects anything else, like a PDF renamed to .jpg or a RIFF that is not WebP", () => {
    expect(detectImageType(bytes(0x25, 0x50, 0x44, 0x46))).toBeNull();
    expect(detectImageType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});
