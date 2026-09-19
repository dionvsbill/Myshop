"use client";

import { useMemo, useState } from "react";

type Option = { id: string; name: string; position: number; values: { id: string; value: string; swatch_hex?: string | null }[] };
type Variant = { id: string; price: number; stock: number; option_values: Record<string,string>; image_url?: string | null };

export default function ProductOptions({ productId, options, variants, fallbackPrice, fallbackStock }: { productId:string; options:Option[]; variants:Variant[]; fallbackPrice:number; fallbackStock:number }) {
  const [selected, setSelected] = useState<Record<string,string>>({});
  const match = useMemo(() => variants.find(v => options.every(o => !selected[o.name] || v.option_values?.[o.name] === selected[o.name])), [selected, variants, options]);
  const price = match?.price ?? fallbackPrice;
  const stock = match?.stock ?? fallbackStock;
  return <div className="mt-6 space-y-5">
    {options.map(o => <div key={o.id}>
      <div className="mb-2 flex items-center justify-between"><label className="text-sm font-semibold">{o.name}</label><span className="text-xs text-slate-500">{selected[o.name] || "Select"}</span></div>
      <div className="flex flex-wrap gap-2">
        {o.values.map(v => {
          const active = selected[o.name] === v.value;
          return <button type="button" key={v.id} onClick={() => setSelected(s => ({...s,[o.name]:v.value}))} className={"rounded-lg border px-4 py-2 text-sm transition "+(active?"border-slate-950 bg-slate-950 text-white":"bg-white hover:border-slate-400")}>{o.name.toLowerCase()==="color" && v.swatch_hex ? <span className="mr-2 inline-block h-3 w-3 rounded-full border" style={{backgroundColor:v.swatch_hex}}/>:null}{v.value}</button>
        })}
      </div>
    </div>)}
    <div className="rounded-xl border bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">Selected price</span><strong className="text-xl">GHS {Number(price).toFixed(2)}</strong></div><p className="mt-1 text-xs text-slate-500">{stock > 0 ? stock + " available" : "Out of stock"}</p></div>
    <form action="/api/cart" method="post" className="flex gap-3">
      <input type="hidden" name="product_id" value={productId}/>
      {match ? <input type="hidden" name="variant_id" value={match.id}/> : null}
      <input name="quantity" type="number" min="1" max={stock || 1} defaultValue="1" className="w-24 rounded-lg border p-3" disabled={!stock}/>
      <button disabled={!stock || (options.length>0 && !match)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-white disabled:opacity-50">{options.length>0 && !match ? "Select options" : "Add to Cart"}</button>
    </form>
  </div>;
}
