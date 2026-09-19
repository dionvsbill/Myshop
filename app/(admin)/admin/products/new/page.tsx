"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { createClient } from "../../../../../lib/supabase/client";

export default function NewProduct() {
  const [cats, setCats] = useState<any[]>([]);
  const [f, setF] = useState<any>({ title:"", slug:"", description:"", price:"", compare_price:"", stock:"0", sku:"", category_id:"", is_featured:false, is_active:true });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    createClient().from("categories").select("id,name").order("name").then(({ data }) => setCats(data || []));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const { error } = await createClient().from("products").insert({
      ...f,
      price: Number(f.price),
      compare_price: f.compare_price ? Number(f.compare_price) : null,
      stock: Number(f.stock),
      category_id: f.category_id || null,
    });
    if (error) { setError(error.message); setBusy(false); return; }
    location.href = "/admin/products";
  }

  const input = "store-input";
  return (
    <section className="max-w-5xl">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-950"><ArrowLeft size={16}/> Products</Link>
      <div className="mt-4"><p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Catalogue</p><h1 className="mt-2 text-3xl font-black tracking-tight">Add product</h1></div>
      <form onSubmit={save} className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-xl border bg-white p-6"><h2 className="font-bold">Product information</h2><div className="mt-5 space-y-4">
            <label className="block text-sm font-medium">Title<input className={"mt-2 " + input} required value={f.title} onChange={e=>setF({...f,title:e.target.value})}/></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">URL slug<input className={"mt-2 " + input} required value={f.slug} onChange={e=>setF({...f,slug:e.target.value})}/></label><label className="block text-sm font-medium">SKU<input className={"mt-2 " + input} value={f.sku} onChange={e=>setF({...f,sku:e.target.value})}/></label></div>
            <label className="block text-sm font-medium">Description<textarea className={"mt-2 min-h-40 " + input} required value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></label>
          </div></div>
          <div className="rounded-xl border bg-white p-6"><h2 className="font-bold">Pricing & inventory</h2><div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium">Price<input type="number" min="0" step="0.01" className={"mt-2 " + input} required value={f.price} onChange={e=>setF({...f,price:e.target.value})}/></label>
            <label className="block text-sm font-medium">Compare at<input type="number" min="0" step="0.01" className={"mt-2 " + input} value={f.compare_price} onChange={e=>setF({...f,compare_price:e.target.value})}/></label>
            <label className="block text-sm font-medium">Stock<input type="number" min="0" className={"mt-2 " + input} required value={f.stock} onChange={e=>setF({...f,stock:e.target.value})}/></label>
          </div></div>
          <div className="rounded-xl border bg-white p-6"><h2 className="font-bold">Media</h2><div className="mt-4 grid min-h-32 place-items-center rounded-xl border-2 border-dashed bg-neutral-50 p-6 text-center"><ImagePlus className="text-neutral-400"/><p className="mt-2 text-sm font-medium">Product images</p><p className="text-xs text-neutral-500">Connect this area to Supabase Storage for uploads.</p></div></div>
        </div>
        <aside className="space-y-5">
          <div className="rounded-xl border bg-white p-6"><h2 className="font-bold">Status</h2><div className="mt-5 space-y-3"><label className="flex items-center justify-between text-sm"><span>Active</span><input type="checkbox" checked={f.is_active} onChange={e=>setF({...f,is_active:e.target.checked})}/></label><label className="flex items-center justify-between text-sm"><span>Featured</span><input type="checkbox" checked={f.is_featured} onChange={e=>setF({...f,is_featured:e.target.checked})}/></label></div></div>
          <div className="rounded-xl border bg-white p-6"><h2 className="font-bold">Organisation</h2><label className="mt-4 block text-sm font-medium">Collection<select className={"mt-2 " + input} value={f.category_id} onChange={e=>setF({...f,category_id:e.target.value})}><option value="">No collection</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          <button disabled={busy} className="w-full rounded-xl bg-neutral-950 px-5 py-3.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Saving..." : "Save product"}</button>
        </aside>
      </form>
    </section>
  );
}
