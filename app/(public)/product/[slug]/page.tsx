"use client";

import { useEffect, useState } from "react";
import { PackageOpen, Star } from "lucide-react";
import ProductOptions from "../../../../components/ProductOptions";
import { createClient } from "../../../../lib/supabase/client";
import RecommendationTracker from "../../../../components/RecommendationTracker";
import { LiquidMorphGallery } from "../../../../components/LiquidMorphGallery";

export default function Product({ params }: { params: { slug: string } }) {
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const s = createClient();
      const { data } = await s.from("products").select("*,categories(name),product_options(id,name,position,product_option_values(id,value,swatch_hex,position)),product_variants(id,price,stock,option_values,image_url,is_active),product_media(id,url,alt_text,position,is_featured)").eq("slug", params.slug).eq("is_active", true).single();
      setP(data);
      setLoading(false);
    };
    load();
  }, [params.slug]);

  if (loading) return <section className="grid gap-10 md:grid-cols-2"><div className="h-[560px] animate-pulse rounded-[28px] bg-zinc-200" /><div className="space-y-4"><div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200" /><div className="h-24 animate-pulse rounded bg-zinc-200" /></div></section>;
  if (!p) return <section className="py-20 text-center"><PackageOpen className="mx-auto h-16 w-16 text-zinc-300" /><h1 className="mt-4 text-2xl font-bold">Product not found</h1></section>;

  const media = (p.product_media || []).sort((a: any, b: any) => a.position - b.position);
  const images = media.length ? media.map((m: any) => m.url).filter(Boolean) : (p.images || []).filter(Boolean);
  const options = (p.product_options || []).sort((a: any, b: any) => a.position - b.position).map((o: any) => ({ ...o, values: (o.product_option_values || []).sort((a: any, b: any) => a.position - b.position) }));
  const variants = (p.product_variants || []).filter((v: any) => v.is_active);

  return (
    <section>
      <RecommendationTracker productId={p.id} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)]">
        <LiquidMorphGallery images={images} title={p.title} />
        <div>
          <p className="eyebrow">{p.categories?.name}{p.brand ? " · " + p.brand : ""}</p>
          <h1 className="page-title mt-2">{p.title}</h1>
          <div className="mt-3 flex items-center gap-1 text-sm"><Star className="fill-current" size={17} />{Number(p.rating || 0).toFixed(1)} ({p.review_count || 0})</div>
          <p className="mt-5 text-3xl font-black">GHS {Number(p.price).toFixed(2)}</p>
          {p.compare_price && <p className="text-sm text-zinc-500 line-through">GHS {Number(p.compare_price).toFixed(2)}</p>}
          <p className="mt-6 whitespace-pre-wrap leading-7 text-zinc-600">{p.description}</p>
          {p.features?.length > 0 && <div className="mt-6"><h2 className="font-bold">Highlights</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">{p.features.map((x: string) => <li key={x}>{x}</li>)}</ul></div>}
          <ProductOptions productId={p.id} options={options} variants={variants} fallbackPrice={Number(p.price)} fallbackStock={p.stock} />
          {p.specifications && <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5"><h2 className="font-bold">Specifications</h2><dl className="mt-3 space-y-2 text-sm">{Object.entries(p.specifications).map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b py-2 last:border-0"><dt className="text-zinc-500">{k}</dt><dd className="text-right font-medium">{String(v)}</dd></div>)}</dl></div>}
        </div>
      </div>
    </section>
  );
}