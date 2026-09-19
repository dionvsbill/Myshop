import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import CartActions from "../../../components/CartActions";
import { createClient } from "../../../lib/supabase/server";

export default async function Cart() {
  const s = await createClient();
  const { data:user } = await s.auth.getUser();
  if (!user.user) return <div className="py-20 text-center"><ShoppingBag className="mx-auto h-12 w-12"/><h1 className="mt-4 text-2xl font-bold">Sign in to use your cart</h1><Link className="mt-5 inline-block rounded-lg bg-slate-950 px-5 py-3 text-white" href="/login">Sign in</Link></div>;

  const { data } = await s.from("cart_items").select("id,quantity,variant_id,products(id,title,price,images,stock),product_variants(id,title,price,stock,option_values,image_url)").eq("user_id",user.user.id);
  const items = data || [];
  const total = items.reduce((n:any,i:any)=>n + Number(i.product_variants?.price ?? i.products?.price ?? 0) * i.quantity, 0);

  return <section>
    <h1 className="text-3xl font-bold">Your cart</h1>
    {!items.length ? <div className="mt-8 rounded-xl border bg-white p-10 text-center"><p className="text-slate-500">Your cart is empty.</p><Link href="/products" className="mt-5 inline-block rounded-lg bg-slate-950 px-5 py-3 text-white">Continue shopping</Link></div> :
    <div className="mt-8 grid gap-8 md:grid-cols-[1fr_340px]">
      <div className="space-y-3">{items.map((i:any)=>{
        const variant=i.product_variants;
        const stock=variant?.stock ?? i.products?.stock ?? 0;
        const price=Number(variant?.price ?? i.products?.price ?? 0);
        return <div key={i.id} className="flex gap-4 rounded-xl border bg-white p-4">
          <div className="h-24 w-24 rounded-lg bg-slate-100">{(variant?.image_url||i.products?.images?.[0])&&<img src={variant?.image_url||i.products.images[0]} className="h-full w-full rounded-lg object-cover" alt=""/>}</div>
          <div className="flex-1"><h2 className="font-semibold">{i.products?.title}</h2>
            {variant?.title&&<p className="text-sm text-slate-500">{variant.title}</p>}
            <p>GHS {price.toFixed(2)}</p>
            <CartActions itemId={i.id} productId={i.products?.id} variantId={i.variant_id} quantity={i.quantity} stock={stock}/>
          </div>
        </div>
      })}</div>
      <aside className="h-fit rounded-xl border bg-white p-5"><h2 className="font-bold">Summary</h2><p className="mt-4 flex justify-between"><span>Subtotal</span><b>GHS {total.toFixed(2)}</b></p><Link href="/checkout" className="mt-5 block rounded-lg bg-blue-600 py-3 text-center text-white">Checkout</Link></aside>
    </div>}
  </section>;
}