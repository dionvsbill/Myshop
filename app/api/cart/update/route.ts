import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(req:Request){
  const body=await req.json();
  const s=await createClient();
  const {data:u}=await s.auth.getUser();
  if(!u.user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const quantity=Math.floor(Number(body.quantity));
  if(!Number.isFinite(quantity)||quantity<1) return NextResponse.json({error:"Invalid quantity"},{status:400});

  let q=s.from("products").select("id,stock").eq("id",body.product_id).single();
  const {data:p}=await q;
  if(!p) return NextResponse.json({error:"Product not found"},{status:404});
  let stock=p.stock;
  if(body.variant_id){
    const {data:v}=await s.from("product_variants").select("id,product_id,stock,is_active").eq("id",body.variant_id).single();
    if(!v||v.product_id!==body.product_id||!v.is_active) return NextResponse.json({error:"Variant unavailable"},{status:400});
    stock=v.stock;
  }
  if(quantity>stock) return NextResponse.json({error:"Insufficient stock"},{status:400});

  let update=s.from("cart_items").update({quantity}).eq("user_id",u.user.id).eq("product_id",body.product_id);
  update=body.variant_id ? update.eq("variant_id",body.variant_id) : update.is("variant_id",null);
  if(body.item_id) update=update.eq("id",body.item_id);
  const {error}=await update;
  if(error) return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true});
}