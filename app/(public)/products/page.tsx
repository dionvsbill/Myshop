import Link from "next/link";
import { PackageOpen, Search, ShoppingBag, Star } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";

export default async function Products({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const s = await createClient();
  let q = s.from("products").select("*,categories!inner(name,slug)").eq("is_active", true).order("created_at", { ascending: false });
  if (searchParams.q) q = q.ilike("title", "%" + searchParams.q + "%");
  if (searchParams.category) q = q.eq("categories.slug", searchParams.category);
  const { data, error } = await q;

  if (error) {
    return <section className="py-20 text-center"><h1 className="text-2xl font-black">Unable to load products</h1><p className="mt-2 text-sm text-neutral-500">{error.message}</p></section>;
  }

  return (
    <section>
      <div className="border-b pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Catalogue</p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-4xl font-black tracking-tight">All products</h1><p className="mt-2 text-sm text-neutral-500">{data?.length || 0} products available</p></div>
          <form action="/products" className="flex w-full max-w-sm items-center rounded-xl border bg-white px-3">
            <Search size={18} className="text-neutral-400" />
            <input name="q" defaultValue={searchParams.q || ""} placeholder="Search the catalogue" className="w-full px-3 py-3 text-sm outline-none" />
          </form>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
        {(data || []).map((p) => (
          <article key={p.id} className="group">
            <Link href={"/product/" + p.slug}>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
                {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><PackageOpen className="text-neutral-300" size={46}/></div>}
                {p.compare_price && Number(p.compare_price) > Number(p.price) && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold">Sale</span>}
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0"><h2 className="line-clamp-2 text-sm font-semibold">{p.title}</h2><p className="mt-1 text-xs text-neutral-500">{p.categories?.name}</p></div>
                <span className="shrink-0 text-sm font-bold">GHS {Number(p.price).toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500"><Star size={14} className="fill-current" /> {Number(p.rating || 0).toFixed(1)} · {p.review_count || 0} reviews</div>
            </Link>
            <form action="/api/cart" method="post" className="mt-3">
              <input type="hidden" name="product_id" value={p.id} />
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"><ShoppingBag size={16}/> Add to cart</button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
