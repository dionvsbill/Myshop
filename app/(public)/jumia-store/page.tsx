import Link from "next/link";
import {createClient} from "../../../lib/supabase/server";

function shuffle<T>(items:T[]):T[]{
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

export default async function JumiaStore(){
  const s=await createClient();
  const{data:items}=await s.from("jumia_products").select("*").eq("is_active",true);
  const products=shuffle(items||[]);
  return <main className="container py-8"><div className="mb-8"><p className="eyebrow">Jumia Store</p><h1 className="page-title mt-2">Shop Jumia products</h1><p className="mt-2 max-w-2xl text-sm text-neutral-500">Browse products imported from Jumia Ghana. Product information and availability can change on Jumia.</p></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map((p:any)=><article key={p.id} className="overflow-hidden rounded-xl border bg-white"><Link href={p.source_url} target="_blank" className="block bg-neutral-50">{p.images?.[0]&&<img src={"/api/jumia/image?url="+encodeURIComponent(p.images[0])} alt={p.title} className="h-60 w-full object-contain"/>}</Link><div className="p-4"><div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">Jumia</div><h2 className="mt-1 line-clamp-2 font-semibold">{p.title}</h2><p className="mt-2 text-lg font-bold">{p.price!=null?"GH₵ "+Number(p.price).toLocaleString():"See price on Jumia"}</p>{p.rating&&<p className="mt-1 text-sm text-neutral-500">★ {p.rating} · {p.review_count||0} ratings</p>}<a href={p.jforce_url||p.source_url} target="_blank" rel="noreferrer" className="mt-4 block rounded-lg bg-orange-500 px-4 py-3 text-center text-sm font-bold text-white">View on Jumia</a></div></article>)}</div></main>
}