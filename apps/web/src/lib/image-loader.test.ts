import { describe, expect, it } from "vitest";
import imageLoader from "./image-loader";

describe("imageLoader", () => {
  it("asks Cloudinary for the width next/image needs, in the best format and quality", () => {
    expect(imageLoader({ src: "https://res.cloudinary.com/demo/image/upload/v1/terpenex-products/a.jpg", width: 640 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_640/v1/terpenex-products/a.jpg",
    );
  });

  it("serves local and other files as they are", () => {
    expect(imageLoader({ src: "/brand/terpenex-symbol.png", width: 384 })).toBe("/brand/terpenex-symbol.png?w=384");
    expect(imageLoader({ src: "/home/hero.webp?v=2", width: 1080 })).toBe("/home/hero.webp?v=2&w=1080");
  });
});
