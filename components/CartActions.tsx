"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartActions({ itemId, productId, variantId, quantity, stock }: { itemId:string; productId:string; variantId?:string|null; quantity:number; stock:number }) {
  const router = useRouter();
  async function change(next:number) {
    if (next < 1 || next > stock) return;
    const res = await fetch("/api/cart/update", {
      method: "POST",
      headers: {"content-type":"application/json"},
      body: JSON.stringify({ item_id:itemId, product_id:productId, variant_id:variantId ?? null, quantity:next })
    });
    if (res.ok) router.refresh();
  }
  async function remove() {
    const res = await fetch("/api/cart/remove", {
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({ item_id:itemId, product_id:productId, variant_id:variantId ?? null })
    });
    if (res.ok) router.refresh();
  }
  return <div className="mt-3 flex items-center gap-2">
    <button type="button" disabled={quantity<=1} onClick={()=>change(quantity-1)} className="rounded border p-2 disabled:opacity-40"><Minus size={15}/></button>
    <span className="min-w-8 text-center">{quantity}</span>
    <button type="button" disabled={quantity>=stock} onClick={()=>change(quantity+1)} className="rounded border p-2 disabled:opacity-40"><Plus size={15}/></button>
    <button type="button" onClick={remove} className="ml-2 rounded border p-2 text-red-600"><Trash2 size={15}/></button>
  </div>;
}