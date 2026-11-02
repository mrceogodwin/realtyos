import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, BedDouble, Bath } from "lucide-react";
import { getMarketplaceProperty } from "@/lib/marketplace";
import { PublicEnquiryForm } from "@/components/public-enquiry-form";
import { DatabaseNotConfiguredError } from "@/lib/db";

type Props = { params: Promise<{ tenantSlug: string; propertySlug: string }> };
export const dynamic = "force-dynamic";

export default async function MarketplacePropertyPage({ params }: Props) {
  const { tenantSlug, propertySlug } = await params;
  let property: Awaited<ReturnType<typeof getMarketplaceProperty>> = null;
  let unavailable = false;
  try { property = await getMarketplaceProperty(tenantSlug, propertySlug); }
  catch (error) {
    if (error instanceof DatabaseNotConfiguredError) unavailable = true;
    else throw error;
  }
  if (!property && !unavailable) notFound();
  if (unavailable) return <main className="market-detail-shell"><p>Property details are temporarily unavailable.</p><Link href="/">Back to marketplace</Link></main>;

  const p = property!;
  return <main className="market-detail-shell">
    <header className="market-detail-nav"><Link href="/" className="market-detail-brand"><Building2/> Realty<span>OS</span></Link><Link href={`/s/${p.tenant_slug}`}>Visit {p.tenant_name} ↗</Link></header>
    <div className="market-detail-wrap"><Link href="/#properties" className="market-detail-back"><ArrowLeft size={15}/> Back to properties</Link>
      <div className="market-detail-grid"><section><div className="market-detail-photo" style={p.cover_url?{backgroundImage:`url("${p.cover_url}")`}:undefined}/><div className="market-detail-heading"><div><span className="market-detail-tag">{p.listing_type.replace("_"," ")}</span><h1>{p.title}</h1><p><MapPin size={15}/>{[p.address,p.city,p.state].filter(Boolean).join(", ")||"Nigeria"}</p></div><strong>{formatMoney(p.price,p.currency)}<small>{p.price_period?"/ "+p.price_period:""}</small></strong></div>
      <div className="market-detail-specs">{p.bedrooms!=null&&<span><BedDouble/>{p.bedrooms} bedrooms</span>}{p.bathrooms!=null&&<span><Bath/>{p.bathrooms} bathrooms</span>}{p.area_value!=null&&<span>{p.area_value} {p.area_unit||"sqm"}</span>}</div><h2>About this property</h2><p className="market-detail-description">{p.description||"Contact the publishing company for further property information."}</p></section>
      <aside className="market-detail-aside"><div className="market-detail-agency"><span><Building2/></span><div><b>{p.tenant_name}</b><small>Publishing company</small></div></div><h2>Interested in this property?</h2><p>Your enquiry will be sent to the company responsible for this listing.</p><PublicEnquiryForm workspaceSlug={p.tenant_slug} propertySlug={p.slug}/><Link className="market-detail-agency-link" href={`/s/${p.tenant_slug}`}>View company website ↗</Link></aside></div>
    </div>

  </main>;
}
function formatMoney(amount:number,currency:string){try{return new Intl.NumberFormat("en-NG",{style:"currency",currency:currency||"NGN",maximumFractionDigits:0}).format(amount)}catch{return `${currency} ${amount.toLocaleString("en-NG")}`}}
