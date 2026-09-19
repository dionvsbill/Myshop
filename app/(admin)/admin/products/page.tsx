import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { createClient } from "../../../../lib/supabase/server";

export default async function AdminProducts() {
  const s = await createClient();
  const { data, error } = await s.from("products").select("id,title,price,stock,is_active,categories(name)").order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load products: ${error.message}`);

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Catalogue</p><h1 className="mt-2 text-3xl font-black tracking-tight">Products</h1><p className="mt-2 text-sm text-neutral-500">{data?.length || 0} products in your catalogue</p></div>
        <Link href="/admin/products/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17}/> Add product</Link>
      </div>

      <div className="mt-7 overflow-hidden rounded-xl border bg-white">
        <div className="hidden grid-cols-[1fr_120px_100px_150px_100px] gap-4 border-b bg-neutral-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500 md:grid"><span>Product</span><span>Price</span><span>Stock</span><span>Collection</span><span>Status</span></div>
        {(data ?? []).map((p) => {
          const category = Array.isArray(p.categories) ? p.categories[0] : p.categories;
          return <div key={p.id} className="grid gap-3 border-b px-5 py-4 last:border-0 md:grid-cols-[1fr_120px_100px_150px_100px] md:items-center md:gap-4">
            <Link href={"/admin/products/" + p.id} className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-neutral-100"><Package size={18} className="text-neutral-400"/></div>
              <div className="min-w-0"><p className="truncate font-semibold">{p.title}</p><p className="text-xs text-neutral-500">View product</p></div>
            </Link>
            <span className="text-sm font-semibold">GHS {Number(p.price).toFixed(2)}</span>
            <span className={"text-sm " + (Number(p.stock) < 5 ? "font-semibold text-red-600" : "text-neutral-600")}>{p.stock} in stock</span>
            <span className="text-sm text-neutral-600">{category?.name || "Uncategorised"}</span>
            <span className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold">{p.is_active ? "Active" : "Draft"}</span>
          </div>;
        })}
      </div>
    </section>
  );
}
