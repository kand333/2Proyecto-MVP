import type { ProductCreate } from "@portal/shared/product";

/**
 * Demo catalog created by the seed (T008): 2 published products per category, 4 featured for the home
 * page and 2 with an offer on their cheapest variant. Development data only; prices are examples.
 */
export const DEMO_PRODUCTS = [
  {
    slug: "terpeno-limon",
    name: "Terpeno Limón",
    description: "Perfil cítrico de limón. Frasco con gotario.",
    category: "TERPENES",
    isPublished: true,
    isFeatured: true,
    variants: [
      { name: "1 ml", sku: "DEMO-TER-LIM-1", priceClp: 8990, compareAtPriceClp: 11990, stock: 24, isActive: true },
      { name: "5 ml", sku: "DEMO-TER-LIM-5", priceClp: 29990, compareAtPriceClp: null, stock: 8, isActive: true },
    ],
  },
  {
    slug: "terpeno-mango",
    name: "Terpeno Mango",
    description: "Perfil frutal de mango maduro. Frasco con gotario.",
    category: "TERPENES",
    isPublished: true,
    isFeatured: true,
    variants: [
      { name: "1 ml", sku: "DEMO-TER-MAN-1", priceClp: 8990, compareAtPriceClp: null, stock: 0, isActive: true },
      { name: "5 ml", sku: "DEMO-TER-MAN-5", priceClp: 29990, compareAtPriceClp: null, stock: 5, isActive: true },
    ],
  },
  {
    slug: "vape-desechable-menta",
    name: "Vape desechable Menta",
    description: "Dispositivo desechable sabor menta. Contiene nicotina.",
    category: "VAPES",
    isPublished: true,
    isFeatured: false,
    variants: [{ name: "Unidad", sku: "DEMO-VAP-MEN-1", priceClp: 12990, compareAtPriceClp: null, stock: 30, isActive: true }],
  },
  {
    slug: "vape-recargable-pod",
    name: "Vape recargable Pod",
    description: "Dispositivo recargable con cartucho intercambiable. Contiene nicotina.",
    category: "VAPES",
    isPublished: true,
    isFeatured: false,
    variants: [
      { name: "Negro", sku: "DEMO-VAP-POD-NEG", priceClp: 24990, compareAtPriceClp: null, stock: 6, isActive: true },
      { name: "Verde", sku: "DEMO-VAP-POD-VER", priceClp: 24990, compareAtPriceClp: null, stock: 0, isActive: true },
    ],
  },
  {
    slug: "liquido-frutos-rojos",
    name: "Líquido Frutos rojos",
    description: "Líquido sabor frutos rojos. Contiene nicotina.",
    category: "E_LIQUIDS",
    isPublished: true,
    isFeatured: true,
    variants: [
      { name: "30 ml 3 mg", sku: "DEMO-LIQ-FRO-3", priceClp: 9990, compareAtPriceClp: 12990, stock: 15, isActive: true },
      { name: "30 ml 6 mg", sku: "DEMO-LIQ-FRO-6", priceClp: 10990, compareAtPriceClp: null, stock: 12, isActive: true },
    ],
  },
  {
    slug: "liquido-tabaco-clasico",
    name: "Líquido Tabaco clásico",
    description: "Líquido sabor tabaco. Contiene nicotina.",
    category: "E_LIQUIDS",
    isPublished: true,
    isFeatured: false,
    variants: [{ name: "30 ml 6 mg", sku: "DEMO-LIQ-TAB-6", priceClp: 9990, compareAtPriceClp: null, stock: 20, isActive: true }],
  },
  {
    slug: "jeringa-dosificadora",
    name: "Jeringa dosificadora",
    description: "Jeringa reutilizable para dosificar con precisión.",
    category: "ACCESSORIES",
    isPublished: true,
    isFeatured: true,
    variants: [
      { name: "1 unidad", sku: "DEMO-ACC-JER-1", priceClp: 1490, compareAtPriceClp: null, stock: 100, isActive: true },
      { name: "Pack 10", sku: "DEMO-ACC-JER-10", priceClp: 12990, compareAtPriceClp: null, stock: 10, isActive: true },
    ],
  },
  {
    slug: "malla-extraccion-220",
    name: "Malla de extracción 220 micras",
    description: "Malla de nylon para extracción artesanal.",
    category: "ACCESSORIES",
    isPublished: true,
    isFeatured: false,
    variants: [{ name: "Pack 5", sku: "DEMO-ACC-MAL-220", priceClp: 4890, compareAtPriceClp: null, stock: 40, isActive: true }],
  },
] satisfies ProductCreate[];
