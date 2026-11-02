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
    <style jsx global>{`
      .market-detail-shell{min-height:100vh;background:#080d0c;color:#f1f6f1;font-family:Arial,sans-serif}.market-detail-nav{height:68px;border-bottom:1px solid #26352f;display:flex;justify-content:space-between;align-items:center;padding:0 max(5vw,18px)}.market-detail-brand{display:flex;align-items:center;gap:8px;color:white;text-decoration:none;font-weight:bold}.market-detail-brand svg{color:#b8fa32}.market-detail-brand span{color:#b8fa32}.market-detail-nav>a:last-child{color:#b8fa32;text-decoration:none;font-size:11px}.market-detail-wrap{max-width:1180px;margin:auto;padding:30px 20px}.market-detail-back{display:inline-flex;gap:7px;align-items:center;color:#aab8ad;text-decoration:none;font-size:11px;margin-bottom:20px}.market-detail-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,.8fr);gap:25px}.market-detail-photo{height:430px;border-radius:13px;background:linear-gradient(135deg,#1c3025,#344b3b);background-size:cover;background-position:center}.market-detail-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding:20px 0}.market-detail-tag{color:#b8fa32;text-transform:uppercase;font-size:9px;letter-spacing:1px}.market-detail-heading h1{font-size:27px;margin:8px 0}.market-detail-heading p{display:flex;align-items:center;gap:6px;color:#aab8ad;font-size:11px}.market-detail-heading>strong{color:#b8fa32;font-size:22px;white-space:nowrap}.market-detail-heading small{display:block;color:#aab8ad;font-size:10px;font-weight:normal}.market-detail-specs{display:flex;gap:18px;border-top:1px solid #26352f;border-bottom:1px solid #26352f;padding:16px 0;color:#dce5de;font-size:11px}.market-detail-specs span{display:flex;align-items:center;gap:6px}.market-detail-specs svg{width:15px;color:#b8fa32}.market-detail-grid h2{font-size:17px;margin-top:25px}.market-detail-description{color:#aab8ad;line-height:1.7;font-size:12px}.market-detail-aside{align-self:start;background:#111a17;border:1px solid #26352f;border-radius:12px;padding:20px}.market-detail-agency{display:flex;align-items:center;gap:10px;padding-bottom:18px;border-bottom:1px solid #26352f}.market-detail-agency>span{width:37px;height:37px;border-radius:9px;background:#293c20;color:#b8fa32;display:grid;place-items:center}.market-detail-agency b,.market-detail-agency small{display:block}.market-detail-agency b{font-size:12px}.market-detail-agency small{color:#aab8ad;font-size:9px;margin-top:4px}.market-detail-aside h2{margin:19px 0 7px}.market-detail-aside>p{color:#aab8ad;font-size:10px;line-height:1.5}.market-detail-agency-link{display:block;margin-top:15px;color:#b8fa32;text-decoration:none;font-size:10px}@media(max-width:760px){.market-detail-grid{grid-template-columns:1fr}.market-detail-photo{height:260px}.market-detail-heading{flex-direction:column}.market-detail-heading h1{font-size:22px}.market-detail-heading>strong{font-size:20px}.market-detail-wrap{padding:20px 15px}}
    `}</style>
  </main>;
}
function formatMoney(amount:number,currency:string){try{return new Intl.NumberFormat("en-NG",{style:"currency",currency:currency||"NGN",maximumFractionDigits:0}).format(amount)}catch{return `${currency} ${amount.toLocaleString("en-NG")}`}}
