"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Building2, BedDouble, Bath, ArrowUpRight, ShieldCheck, Heart, SlidersHorizontal } from "lucide-react";
import type { MarketplaceProperty } from "@/lib/marketplace";

type Props = { properties: MarketplaceProperty[]; totalLabel: string; filters: { q: string; listingType: string; city: string; state: string } };

const categories = [
  ["", "All"],
  ["sale", "Buy"],
  ["rent", "Rent"],
  ["short_let", "Shortlet"],
  ["lease", "Lease"],
] as const;

export function MarketplaceHome({ properties, totalLabel, filters }: Props) {
  const [saved, setSaved] = useState<string[]>([]);
  const [active, setActive] = useState(filters.listingType);
  return (
    <main className="marketplace">
      <header className="market-nav">
        <Link href="/" className="market-brand"><span className="market-mark"><Building2 size={24}/></span><span><b>Realty<span>OS</span></b><small>NIGERIA PROPERTY MARKETPLACE</small></span></Link>
        <nav><a href="#properties">Properties</a><a href="#how">How it works</a><Link href="/for-agencies">For agencies</Link><a href="#companies">Companies</a></nav>
        <div className="market-nav-actions"><Link className="market-login" href="/login">Sign in</Link><Link className="market-cta" href="/onboarding">List your property <ArrowUpRight size={15}/></Link></div>
      </header>

      <section className="market-hero">
        <div className="market-hero-image" />
        <div className="market-hero-shade" />
        <div className="market-hero-inner">
          <div className="market-copy">
            <div className="market-eyebrow"><ShieldCheck size={14}/> DISCOVER PROPERTIES FROM REAL ESTATE COMPANIES</div>
            <h1>Find a place to<br/> <em>call your own.</em></h1>
            <p>Explore homes, land and commercial properties published by real estate companies across Nigeria — all in one place.</p>
            <form className="market-search" action="/" method="get">
              <div className="market-tabs">{categories.map(([value,label])=><button key={value} type="button" className={active===value?"active":""} onClick={()=>setActive(value)}>{label}</button>)}</div>
              <input type="hidden" name="listingType" value={active}/>
              <label><MapPin size={17}/><span>Location</span><input name="city" defaultValue={filters.city} placeholder="City or area"/></label>
              <label><Building2 size={17}/><span>Property</span><select name="state" defaultValue={filters.state}><option value="">All states</option>{["Lagos","Abuja","Rivers","Edo","Oyo","Delta","Ogun","Enugu","Anambra","Kano"].map(s=><option key={s}>{s}</option>)}</select></label>
              <label className="market-keyword"><Search size={17}/><input name="q" defaultValue={filters.q} placeholder="Property, company or keyword"/></label>
              <button className="market-search-submit" type="submit"><Search size={16}/> Search properties</button>
            </form>
            <div className="market-trust"><span><i/> Agency-published listings</span><span><i/> Direct company enquiries</span><span><i/> Nigeria-wide discovery</span></div>
          </div>
          <div className="market-hero-note"><b>One marketplace.</b><span>Many trusted real estate companies.</span></div>
        </div>
      </section>

      <section className="market-benefits" id="how">
        <div><ShieldCheck/><b>Agency-published listings</b><span>Every listing is linked to its company</span></div>
        <div><Search/><b>Search across Nigeria</b><span>Discover homes, land and business spaces</span></div>
        <div><Heart/><b>Save your shortlist</b><span>Keep interesting properties together</span></div>
        <div><Building2/><b>Contact the source</b><span>Enquire directly with the listing agency</span></div>
      </section>

      <section className="market-listings" id="properties">
        <div className="market-section-heading"><div><span className="market-overline">FIND YOUR NEXT MOVE</span><h2>Explore properties</h2><p>{totalLabel}</p></div><div className="market-filter-caption"><SlidersHorizontal size={15}/> Search and filter listings above</div></div>
        <div className="market-category-row">{categories.map(([value,label])=><Link key={value} className={filters.listingType===value?"selected":""} href={buildUrl({...filters,listingType:value})}>{label}</Link>)}</div>
        {properties.length===0?<div className="market-empty"><Building2 size={34}/><h3>No matching properties yet</h3><p>Try a different location or category. New agency listings will appear here when published.</p><Link href="/">Clear search</Link></div>:<div className="market-property-grid">{properties.map(p=><article className="market-property-card" key={p.id}>
          <Link href={`/property/${p.tenant_slug}/${p.slug}`} className="market-property-image" style={p.cover_url?{backgroundImage:`url("${p.cover_url}")`}:undefined}><span className="market-listing-badge">{p.listing_type==="sale"?"For sale":p.listing_type==="short_let"?"Shortlet":p.listing_type==="lease"?"For lease":"For rent"}</span></Link>
          <button className={saved.includes(p.id)?"market-save saved":"market-save"} aria-label={saved.includes(p.id)?"Remove saved property":"Save property"} onClick={()=>setSaved(old=>old.includes(p.id)?old.filter(x=>x!==p.id):[...old,p.id])}><Heart size={17} fill={saved.includes(p.id)?"currentColor":"none"}/></button>
          <div className="market-property-body"><div className="market-price">{formatMoney(p.price,p.currency)}<small>{p.price_period?"/ "+p.price_period:""}</small></div><h3><Link href={`/property/${p.tenant_slug}/${p.slug}`}>{p.title}</Link></h3><div className="market-location"><MapPin size={13}/>{[p.city,p.state].filter(Boolean).join(", ")||"Nigeria"}</div><div className="market-specs">{p.bedrooms!=null&&<span><BedDouble size={14}/>{p.bedrooms} beds</span>}{p.bathrooms!=null&&<span><Bath size={14}/>{p.bathrooms} baths</span>}{p.area_value!=null&&<span>{p.area_value} {p.area_unit||"sqm"}</span>}</div>
            <div className="market-agency"><span className="market-agency-logo">{p.logo_url?<img src={p.logo_url} alt=""/>:<Building2 size={16}/>}</span><span><b>{p.tenant_name}</b><small>Publishing company</small></span><Link href={`/s/${p.tenant_slug}`}>Agency site ↗</Link></div>
          </div></article>)}</div>}
      </section>

      <section className="market-company-cta" id="companies"><div><span className="market-overline">FOR REAL ESTATE BUSINESSES</span><h2>Your properties deserve a bigger audience.</h2><p>Run your agency with RealtyOS. Manage listings, leads, inspections and your own branded company website — while making eligible listings discoverable in the central marketplace.</p></div><Link href="/for-agencies">Explore RealtyOS for agencies <ArrowUpRight size={17}/></Link></section>
      <footer className="market-footer"><Link href="/" className="market-brand"><span className="market-mark"><Building2 size={22}/></span><span><b>Realty<span>OS</span></b><small>NIGERIA PROPERTY MARKETPLACE</small></span></Link><span>Discover properties from independent agents and real estate companies across Nigeria.</span><div><Link href="/for-agencies">For agencies</Link><Link href="/login">Sign in</Link><Link href="/api/health">System status</Link></div></footer>
      <style jsx global>{`
        .marketplace{--m-bg:#080d0c;--m-card:#111a17;--m-line:#26352f;--m-text:#f2f7f2;--m-muted:#9aa99f;--m-lime:#b8fa32;background:var(--m-bg);color:var(--m-text);min-height:100vh;font-family:Arial,Helvetica,sans-serif}
        .market-nav{height:76px;display:flex;align-items:center;justify-content:space-between;padding:0 max(5.2vw,22px);border-bottom:1px solid #ffffff16;background:#090e0c;gap:22px}.market-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--m-text);flex-shrink:0}.market-mark{width:39px;height:39px;border-radius:11px;background:var(--m-lime);color:#15210c;display:grid;place-items:center}.market-brand b{display:block;font-size:22px;letter-spacing:-1px}.market-brand b span{color:var(--m-lime)}.market-brand small{display:block;font-size:8px;letter-spacing:1px;color:var(--m-muted);margin-top:3px}.market-nav nav,.market-nav-actions{display:flex;align-items:center;gap:25px}.market-nav nav a,.market-login{font-size:12px;color:#d3ddd5;text-decoration:none}.market-nav nav a:hover,.market-login:hover{color:var(--m-lime)}.market-cta,.market-search-submit{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 17px;border:0;border-radius:8px;background:var(--m-lime);color:#13200a;text-decoration:none;font-size:11px;font-weight:800;white-space:nowrap}
        .market-hero{position:relative;min-height:510px;overflow:hidden;background:#101915}.market-hero-image{position:absolute;inset:0 0 0 37%;background-image:url("https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85");background-size:cover;background-position:center 55%;opacity:.83}.market-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,#080d0c 0%,#080d0cf5 31%,#080d0caa 52%,#080d0c30 100%),linear-gradient(0deg,#080d0c 0%,transparent 42%)}.market-hero-inner{position:relative;max-width:1420px;margin:auto;min-height:510px;padding:75px 5.2vw 38px;display:flex;align-items:center}.market-copy{max-width:690px;width:100%}.market-eyebrow,.market-overline{font-size:9px;letter-spacing:1.6px;color:var(--m-lime);font-weight:800}.market-eyebrow{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #b8fa3244;border-radius:30px;background:#0d1712cc}.market-copy h1{font-size:clamp(42px,5.3vw,68px);line-height:1.02;letter-spacing:-2.6px;margin:22px 0 16px;max-width:640px}.market-copy h1 em{font-style:normal;color:var(--m-lime)}.market-copy>p{max-width:530px;color:#d0d9d2;font-size:15px;line-height:1.65;margin:0 0 24px}.market-search{background:#0c1512f2;border:1px solid #607067;border-radius:13px;padding:10px;display:grid;grid-template-columns:1fr 1fr 1.3fr auto;gap:8px;box-shadow:0 18px 55px #0008}.market-tabs{grid-column:1/-1;display:flex;gap:5px;border-bottom:1px solid #ffffff16;padding-bottom:8px}.market-tabs button{border:0;background:transparent;color:#c6d1c9;padding:8px 14px;border-radius:6px;font-size:11px;cursor:pointer}.market-tabs button.active{background:var(--m-lime);color:#14200b;font-weight:800}.market-search label{min-width:0;display:flex;align-items:center;gap:7px;background:#17221d;padding:8px;border-radius:7px;color:var(--m-lime)}.market-search label span{font-size:9px;color:var(--m-muted)}.market-search input,.market-search select{min-width:0;width:100%;border:0;outline:0;background:transparent;color:#f3f7f3;font-size:11px}.market-search input::placeholder{color:#829187}.market-search select option{background:#17221d}.market-search-submit{padding:0 16px;cursor:pointer}.market-trust{display:flex;gap:17px;flex-wrap:wrap;margin-top:17px;color:#d2ddd4;font-size:10px}.market-trust span{display:flex;align-items:center;gap:6px}.market-trust i{width:6px;height:6px;border-radius:50%;background:var(--m-lime)}.market-hero-note{position:absolute;right:6%;bottom:54px;padding:16px 20px;background:#0c1512dd;border:1px solid #ffffff24;border-radius:10px;display:grid;gap:4px;backdrop-filter:blur(12px)}.market-hero-note b{font-size:14px}.market-hero-note span{font-size:10px;color:var(--m-muted)}
        .market-benefits{max-width:1320px;margin:-1px auto 0;padding:22px 5.2vw;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;border-bottom:1px solid var(--m-line)}.market-benefits>div{display:grid;grid-template-columns:28px 1fr;column-gap:10px;align-items:center}.market-benefits svg{grid-row:span 2;color:var(--m-lime);width:22px}.market-benefits b{font-size:11px}.market-benefits span{font-size:9px;color:var(--m-muted);margin-top:4px}
        .market-listings{max-width:1420px;margin:auto;padding:55px 5.2vw 65px}.market-section-heading{display:flex;justify-content:space-between;align-items:end;gap:20px}.market-section-heading h2{font-size:31px;letter-spacing:-1px;margin:8px 0}.market-section-heading p{font-size:11px;color:var(--m-muted);margin:0}.market-filter-caption{display:flex;align-items:center;gap:8px;color:var(--m-muted);font-size:10px}.market-category-row{display:flex;gap:8px;margin:24px 0 18px;flex-wrap:wrap}.market-category-row a{padding:9px 15px;border:1px solid var(--m-line);border-radius:22px;text-decoration:none;color:#d3ddd5;font-size:10px}.market-category-row a.selected,.market-category-row a:hover{background:var(--m-lime);border-color:var(--m-lime);color:#15210c}.market-property-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.market-property-card{position:relative;overflow:hidden;background:var(--m-card);border:1px solid var(--m-line);border-radius:12px;min-width:0}.market-property-image{height:210px;display:block;background:linear-gradient(135deg,#1b3025,#283a30);background-size:cover;background-position:center;position:relative}.market-listing-badge{position:absolute;top:13px;left:13px;background:var(--m-lime);color:#15210c;padding:6px 9px;border-radius:5px;font-size:9px;font-weight:800}.market-save{position:absolute;right:13px;top:13px;width:32px;height:32px;border:0;border-radius:50%;background:#101a16d9;color:white;display:grid;place-items:center;cursor:pointer}.market-save.saved{color:var(--m-lime)}.market-property-body{padding:15px}.market-price{font-size:19px;font-weight:800;color:var(--m-lime)}.market-price small{font-size:9px;color:var(--m-muted);font-weight:400;margin-left:4px}.market-property-body h3{font-size:14px;margin:9px 0}.market-property-body h3 a{color:var(--m-text);text-decoration:none}.market-location{display:flex;align-items:center;gap:5px;color:var(--m-muted);font-size:10px}.market-specs{display:flex;gap:14px;padding:13px 0;border-bottom:1px solid var(--m-line);color:#cbd6ce;font-size:9px}.market-specs span{display:flex;align-items:center;gap:4px}.market-agency{display:flex;align-items:center;gap:8px;padding-top:12px}.market-agency-logo{width:30px;height:30px;border-radius:8px;background:#26391f;color:var(--m-lime);display:grid;place-items:center;overflow:hidden}.market-agency-logo img{width:100%;height:100%;object-fit:cover}.market-agency>span:nth-child(2){flex:1;min-width:0}.market-agency b,.market-agency small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.market-agency b{font-size:9px}.market-agency small{font-size:8px;color:var(--m-muted);margin-top:3px}.market-agency>a{font-size:9px;color:var(--m-lime);text-decoration:none;white-space:nowrap}.market-empty{padding:55px 20px;text-align:center;border:1px dashed var(--m-line);border-radius:12px;color:var(--m-muted)}.market-empty svg{color:var(--m-lime)}.market-empty h3{color:var(--m-text);margin:12px 0 5px}.market-empty p{font-size:11px}.market-empty a{display:inline-block;margin-top:8px;color:var(--m-lime);font-size:11px}
        .market-company-cta{max-width:1320px;margin:0 auto 60px;padding:34px 38px;border:1px solid #b8fa3255;border-radius:15px;background:linear-gradient(110deg,#17271b,#0e1712 65%);display:flex;align-items:center;justify-content:space-between;gap:25px}.market-company-cta h2{font-size:27px;max-width:580px;margin:9px 0}.market-company-cta p{max-width:650px;color:var(--m-muted);font-size:11px;line-height:1.6}.market-company-cta>a{display:flex;align-items:center;gap:8px;padding:14px 18px;background:var(--m-lime);color:#15210c;text-decoration:none;border-radius:8px;font-size:10px;font-weight:800;white-space:nowrap}.market-footer{padding:28px 5.2vw;border-top:1px solid var(--m-line);display:flex;align-items:center;justify-content:space-between;gap:25px}.market-footer>span{max-width:330px;color:var(--m-muted);font-size:9px;line-height:1.6}.market-footer>div{display:flex;gap:18px}.market-footer>div a{color:#d4ded6;text-decoration:none;font-size:10px}
        @media(max-width:1000px){.market-nav nav{gap:13px}.market-nav nav a{font-size:10px}.market-hero-image{left:28%}.market-search{grid-template-columns:1fr 1fr}.market-search-submit{min-height:40px}.market-hero-note{display:none}.market-property-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.market-benefits{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:650px){.market-nav{height:auto;min-height:66px;padding:12px 16px;flex-wrap:wrap}.market-brand b{font-size:19px}.market-nav nav{order:3;width:100%;overflow:auto;padding:7px 0 2px;gap:20px}.market-nav-actions{gap:12px}.market-cta{padding:10px;font-size:9px}.market-login{font-size:10px}.market-hero,.market-hero-inner{min-height:0}.market-hero-image{inset:0;background-position:center;opacity:.34}.market-hero-shade{background:linear-gradient(90deg,#080d0cf2,#080d0c9c),linear-gradient(0deg,#080d0c,transparent)}.market-hero-inner{padding:48px 17px 32px}.market-copy h1{font-size:43px;letter-spacing:-1.8px}.market-copy>p{font-size:12px}.market-search{grid-template-columns:1fr 1fr;padding:8px}.market-tabs{overflow:auto}.market-tabs button{padding:8px 10px;white-space:nowrap}.market-search label{padding:9px 7px}.market-search label span{display:none}.market-search-submit{grid-column:1/-1;min-height:43px}.market-trust{gap:9px;font-size:8px}.market-benefits{padding:20px 17px;gap:18px}.market-benefits b{font-size:9px}.market-benefits span{font-size:8px}.market-listings{padding:38px 16px}.market-section-heading{align-items:flex-start;flex-direction:column}.market-section-heading h2{font-size:26px}.market-filter-caption{display:none}.market-property-grid{grid-template-columns:1fr}.market-property-image{height:220px}.market-company-cta{margin:0 15px 35px;padding:23px;align-items:flex-start;flex-direction:column}.market-company-cta h2{font-size:23px}.market-company-cta>a{white-space:normal}.market-footer{padding:25px 17px;align-items:flex-start;flex-direction:column;gap:15px}.market-footer>div{flex-wrap:wrap}}
      `}</style>
    </main>
  );
}

function buildUrl(filters: Props["filters"] & {listingType:string}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q",filters.q);
  if (filters.city) params.set("city",filters.city);
  if (filters.state) params.set("state",filters.state);
  if (filters.listingType) params.set("listingType",filters.listingType);
  const query = params.toString();
  return query ? "/?"+query+"#properties" : "/#properties";
}
function formatMoney(amount:number,currency:string) {
  try { return new Intl.NumberFormat("en-NG",{style:"currency",currency:currency||"NGN",maximumFractionDigits:0}).format(amount); }
  catch { return `${currency} ${amount.toLocaleString("en-NG")}`; }
}
