import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { createClient } from "../../../../lib/supabase/server";
import EditProductModal from "../../../../components/EditProductModal";

export default async function AdminProducts() {
  const s=await createClient();
  const {data,error}=await s.from("products").select("id,title,price,stock,is_active,categories(name)").order("created_at",{ascending:false});
  if(error) throw new Error(error.message);
  return <section>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Catalogue management</p><h1 className="page-title mt-2">Products</h1><p className="mt-2 text-sm text-neutral-500">{data?.length||0} products in your catalogue</p></div><Link href="/admin/products/new" className="btn-primary gap-2"><Plus size={17}/> Add product</Link></div>
    <div className="mt-7 overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="hidden grid-cols-[1fr_120px_100px_150px_90px] gap-4 border-b bg-neutral-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-neutral-500 md:grid"><span>Product</span><span>Price</span><span>Stock</span><span>Category</span><span>Action</span></div>
      {(data||[]).map((p:any)=>{const category=Array.isArray(p.categories)?p.categories[0]:p.categories;return <div key={p.id} className="grid gap-3 border-b px-5 py-4 last:border-0 md:grid-cols-[1fr_120px_100px_150px_90px] md:items-center">
        <Link href={"/product/"+p.id} className="flex items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-neutral-100"><Package size={18} className="text-neutral-400"/></div><div className="min-w-0"><p className="truncate font-semibold">{p.title}</p><span className={"text-xs "+(p.is_active?"text-emerald-600":"text-neutral-400")}>{p.is_active?"Published":"Draft"}</span></div></Link>
        <span className="text-sm font-bold">GHS {Number(p.price).toFixed(2)}</span>
        <span className={"text-sm "+(Number(p.stock)<5?"font-bold text-red-600":"text-neutral-600")}>{p.stock}</span>
        <span className="text-sm text-neutral-600">{category?.name||"Uncategorised"}</span>
        <EditProductModal product={p}/>
      </div>})}
    </div>
  </section>;
}