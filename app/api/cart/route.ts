import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function POST(req:Request){
  const form=await req.formData();
  const product_id=String(form.get("product_id")||"");
  const variant_id=String(form.get("variant_id")||"")||null;
  const quantity=Math.max(1,Number(form.get("quantity")||1));
  const s=await createClient();
  const {data:u}=await s.auth.getUser();
  if(!u.user)return NextResponse.redirect(new URL("/login",req.url));

  const {data:p}=await s.from("products").select("id,stock,is_active").eq("id",product_id).single();
  if(!p||!p.is_active)return NextResponse.json({error:"Product unavailable"},{status:400});

  let available=p.stock;
  if(variant_id){
    const {data:v}=await s.from("product_variants").select("id,product_id,stock,is_active").eq("id",variant_id).single();
    if(!v||v.product_id!==product_id||!v.is_active)return NextResponse.json({error:"Variant unavailable"},{status:400});
    available=v.stock;
  }
  if(available<quantity)return NextResponse.json({error:"Insufficient stock"},{status:400});

  const {data:existing}=await s.from("cart_items").select("id,quantity").eq("user_id",u.user.id).eq("product_id",product_id).is("variant_id",variant_id===null?null:undefined).maybeSingle();
  if(variant_id===null){
    const {data:e}=await s.from("cart_items").select("id,quantity").eq("user_id",u.user.id).eq("product_id",product_id).is("variant_id",null).maybeSingle();
    if(e){const {error}=await s.from("cart_items").update({quantity:Math.min(available,e.quantity+quantity)}).eq("id",e.id);if(error)return NextResponse.json({error:error.message},{status:400});}
    else {const {error}=await s.from("cart_items").insert({user_id:u.user.id,product_id,variant_id:null,quantity});if(error)return NextResponse.json({error:error.message},{status:400});}
  } else {
    const {data:e}=await s.from("cart_items").select("id,quantity").eq("user_id",u.user.id).eq("product_id",product_id).eq("variant_id",variant_id).maybeSingle();
    if(e){const {error}=await s.from("cart_items").update({quantity:Math.min(available,e.quantity+quantity)}).eq("id",e.id);if(error)return NextResponse.json({error:error.message},{status:400});}
    else {const {error}=await s.from("cart_items").insert({user_id:u.user.id,product_id,variant_id,quantity});if(error)return NextResponse.json({error:error.message},{status:400});}
  }
  return NextResponse.redirect(new URL("/cart",req.url));
}