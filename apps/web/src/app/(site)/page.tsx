import type { PublicProductSummary } from "@portal/shared/product";
import { HomeHero } from "@/components/home/home-hero";
import { HomeMarquee } from "@/components/home/home-marquee";
import { AboutStrip, BrandBand, FeaturedCollection, SplitFeature } from "@/components/home/home-sections";
import { homeContent } from "@/lib/home-content";
import { fetchCatalog } from "@/lib/public-products-api";

/** The featured collection is optional: if the API fails, the rest of the home page still renders. */
async function loadFeatured(): Promise<PublicProductSummary[]> {
  try {
    return (await fetchCatalog({ page: 1, search: "" }, { featured: true })).data;
  } catch {
    return [];
  }
}

/** Home page with the blocks of docs/design.md in order (RF-25, DEC-016). */
export default async function HomePage() {
  const featured = await loadFeatured();
  const { hero, marquee, featured: featuredText, band, split, about } = homeContent;

  return (
    <>
      <HomeHero titleLines={hero.titleLines} cta={hero.cta} image={hero.image} />
      <HomeMarquee phrases={marquee} />
      <FeaturedCollection title={featuredText.title} linkLabel={featuredText.linkLabel} products={featured} />
      <BrandBand statement={band.statement} />
      <SplitFeature title={split.title} body={split.body} image={split.image} />
      <AboutStrip text={about} />
    </>
  );
}
