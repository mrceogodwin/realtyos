import { listMarketplaceProperties } from "@/lib/marketplace";
import { MarketplaceHome } from "@/components/marketplace-home";
import { DatabaseNotConfiguredError } from "@/lib/db";

type SearchParams = Promise<{ q?: string; listingType?: string; city?: string; state?: string }>;

export const dynamic = "force-dynamic";

export default async function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = {
    q: params.q ?? "",
    listingType: params.listingType ?? "",
    city: params.city ?? "",
    state: params.state ?? "",
  };
  let properties: Awaited<ReturnType<typeof listMarketplaceProperties>> = [];
  let databaseUnavailable = false;
  try {
    properties = await listMarketplaceProperties({
      q: filters.q,
      listingType: filters.listingType,
      city: filters.city,
      state: filters.state,
      limit: 24,
    });
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) databaseUnavailable = true;
    else throw error;
  }

  const totalLabel = databaseUnavailable
    ? "Marketplace listings will appear when the database is connected."
    : properties.length
      ? `Showing ${properties.length} published propert${properties.length === 1 ? "y" : "ies"} from participating companies.`
      : "Browse published listings from participating real estate companies.";
  return <MarketplaceHome properties={properties} totalLabel={totalLabel} filters={filters} />;
}
